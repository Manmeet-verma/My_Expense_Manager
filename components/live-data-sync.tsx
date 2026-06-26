"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { subscribeToExpenseChanges } from "@/lib/supabase/realtime"

interface LiveDataSyncProps {
  intervalMs?: number
}

const hasRealtimeConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL
    && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
)

export function LiveDataSync({ intervalMs = 30000 }: LiveDataSyncProps) {
  const router = useRouter()

  useEffect(() => {
    let lastRefresh = 0
    let refreshInFlight = false

    const refreshWithCooldown = () => {
      const now = Date.now()
      if (refreshInFlight) return
      if (now - lastRefresh < 5000) return

      refreshInFlight = true
      lastRefresh = now
      router.refresh()

      // Prevent burst refresh loops that can exhaust DB pool connections.
      window.setTimeout(() => {
        refreshInFlight = false
      }, 1500)
    }

    const unsubscribe = subscribeToExpenseChanges(() => {
      refreshWithCooldown()
    })

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "expense-updates") {
        refreshWithCooldown()
      }
    }
    window.addEventListener("storage", handleStorage)

    const handleVisible = () => {
      if (document.visibilityState === "visible") {
        refreshWithCooldown()
      }
    }

    // Poll only when realtime credentials are unavailable.
    const timer = hasRealtimeConfig
      ? null
      : window.setInterval(() => {
          if (document.visibilityState === "visible") {
            refreshWithCooldown()
          }
        }, Math.max(intervalMs, 60000))

    document.addEventListener("visibilitychange", handleVisible)

    return () => {
      unsubscribe()
      window.removeEventListener("storage", handleStorage)
      document.removeEventListener("visibilitychange", handleVisible)
      if (timer) {
        window.clearInterval(timer)
      }
    }
  }, [intervalMs, router])

  return null
}
