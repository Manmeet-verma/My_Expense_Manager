"use client"

import { useEffect, useRef } from "react"
import { signOut, useSession } from "next-auth/react"

const IDLE_TIMEOUT_MS = 60_000

export function SessionIdleLogout() {
  const { status } = useSession()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status !== "authenticated") {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    const resetIdleTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        void signOut({ callbackUrl: "/login" })
      }, IDLE_TIMEOUT_MS)
    }

    const activityEvents: Array<keyof WindowEventMap> = [
      "click",
      "keydown",
      "mousemove",
      "mousedown",
      "scroll",
      "touchstart",
      "focus",
    ]

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer)
    })
    document.addEventListener("visibilitychange", resetIdleTimer)
    resetIdleTimer()

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer)
      })
      document.removeEventListener("visibilitychange", resetIdleTimer)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [status])

  return null
}