import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { authSecretSource } from "@/lib/auth"

const isSet = (name: string) => Boolean(process.env[name]?.trim())

export async function GET() {
  const h = await headers()

  return NextResponse.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV ?? null,
    host: h.get("x-forwarded-host") ?? h.get("host"),
    forwardedProto: h.get("x-forwarded-proto"),
    authSecretSource,
    env: {
      AUTH_SECRET: isSet("AUTH_SECRET"),
      NEXTAUTH_SECRET: isSet("NEXTAUTH_SECRET"),
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
      DATABASE_URL: isSet("DATABASE_URL"),
      DIRECT_URL: isSet("DIRECT_URL"),
      PG_POOL_MAX: isSet("PG_POOL_MAX"),
      NEXT_PUBLIC_SUPABASE_URL: isSet("NEXT_PUBLIC_SUPABASE_URL"),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: isSet("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: isSet("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    },
  })
}
