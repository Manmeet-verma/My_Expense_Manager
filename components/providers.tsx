"use client"

import { SessionProvider } from "next-auth/react"
import { SessionIdleLogout } from "@/components/session-idle-logout"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={true} refetchInterval={300}>
      <SessionIdleLogout />
      {children}
    </SessionProvider>
  )
}
