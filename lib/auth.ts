import { getServerSession, type NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare, hash } from "bcryptjs"
import { randomBytes } from "crypto"
import { mkdirSync, readFileSync, writeFileSync } from "fs"
import path from "path"
import { prisma } from "./prisma"
import { Role } from "@/lib/types"

export type AuthSecretSource = "env" | "file" | "generated"

const isProduction = process.env.NODE_ENV === "production"
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"

function resolveAuthSecret(): { secret: string; source: AuthSecretSource } {
  const fromEnv = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()
  if (fromEnv) return { secret: fromEnv, source: "env" }

  const file = path.join(process.cwd(), ".data", "auth-secret")

  try {
    const existing = readFileSync(file, "utf8").trim()
    if (existing) return { secret: existing, source: "file" }
  } catch {
    // Not created yet.
  }

  const generated = randomBytes(32).toString("base64")

  if (isBuildPhase) return { secret: generated, source: "generated" }

  try {
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, generated, { encoding: "utf8", mode: 0o600, flag: "wx" })
    return { secret: generated, source: "file" }
  } catch {
    try {
      const existing = readFileSync(file, "utf8").trim()
      if (existing) return { secret: existing, source: "file" }
    } catch {
      // Unwritable filesystem; fall through to a process-local secret.
    }
  }

  return { secret: generated, source: "generated" }
}

const { secret: authSecret, source: authSecretSource } = resolveAuthSecret()

export { authSecretSource }

if (authSecretSource !== "env") {
  const log = isBuildPhase ? console.warn : console.error
  log(
    authSecretSource === "file"
      ? "[auth] AUTH_SECRET is not set — using a generated secret from .data/auth-secret. Add AUTH_SECRET to the environment variables so it survives redeploys."
      : "[auth] AUTH_SECRET is not set and .data/auth-secret is not writable — sessions will reset on every restart. Add AUTH_SECRET to the environment variables.",
  )
}

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  jwt: {
    maxAge: 5 * 365 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: isProduction ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        secure: isProduction,
        maxAge: 5 * 365 * 24 * 60 * 60,
      },
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        console.log("[auth] Attempting login for:", credentials.email)

        const normalizedEmail = (credentials.email as string).trim().toLowerCase()

        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: normalizedEmail,
              mode: "insensitive",
            },
          },
        })

        if (!user) {
          return null
        }

        if (!user.password) {
          return null
        }

        const inputPassword = credentials.password as string
        const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password)

        const isPasswordValid = isBcryptHash
          ? await compare(inputPassword, user.password)
          : inputPassword === user.password

        if (!isPasswordValid) {
          return null
        }

        // Best-effort auto-migration for legacy plaintext passwords.
        // Do not block login if migration fails.
        if (!isBcryptHash) {
          try {
            const upgradedHash = await hashPassword(inputPassword)
            await prisma.user.update({
              where: { id: user.id },
              data: { password: upgradedHash },
            })
          } catch {
            // Silently ignore hash upgrade failures to not block login
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role as Role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 5 * 365 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
}

export async function auth() {
  if (!authSecret) {
    return null
  }
  try {
    return await getServerSession(authOptions)
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}
