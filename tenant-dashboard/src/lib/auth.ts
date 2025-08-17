import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { z } from "zod"
import { SecurityUtils } from "./security"
import bcrypt from "bcryptjs"

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// Always use real backend services - NO MOCKING POLICY
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours for security
    updateAge: 60 * 60, // Update session every hour
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 hours
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60,
      },
    },
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  providers: [
    // Google OAuth provider (optional - configured via environment variables)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    ] : []),
    // GitHub OAuth provider (optional - configured via environment variables)
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    ] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 NextAuth authorize called with:", credentials)
        try {
          // Validate input
          const { email, password } = loginSchema.parse(credentials)
          console.log("✅ Credentials validated:", { email, password: "***" })

          // Call API Gateway auth endpoint - NO MOCKING POLICY
          console.log("📞 Calling API Gateway auth service:", `${AUTH_SERVICE_URL}/api/auth/login`)
          const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          })

          console.log("📥 API Gateway auth service response status:", response.status)

          if (!response.ok) {
            const errorText = await response.text()
            console.error("API Gateway auth service login failed:", response.status, errorText)
            throw new Error(`Backend auth service unavailable at ${AUTH_SERVICE_URL}. DevOps agent needed.`)
          }

          const authResult = await response.json()
          console.log("✅ API Gateway auth service success")

          // Handle different response formats from platform services
          let user
          if (authResult.access_token) {
            // JWT format from platform services
            try {
              const jwtPayload = JSON.parse(Buffer.from(authResult.access_token.split('.')[1], 'base64').toString())
              user = {
                id: jwtPayload.user_id || jwtPayload.sub,
                email: jwtPayload.email,
                name: jwtPayload.name || jwtPayload.email.split('@')[0],
                accessToken: authResult.access_token,
                refreshToken: authResult.refresh_token,
                role: jwtPayload.role || "user",
                tenantId: jwtPayload.tenant_id,
              }
            } catch (jwtError) {
              console.error("Failed to decode JWT:", jwtError)
              return null
            }
          } else if (authResult.token && authResult.user) {
            // Direct format from platform services
            user = {
              id: authResult.user.id,
              email: authResult.user.email,
              name: authResult.user.name || authResult.user.email.split('@')[0],
              accessToken: authResult.token,
              refreshToken: authResult.refresh_token,
              role: authResult.user.role || "user",
              tenantId: authResult.user.tenant_id,
            }
          } else {
            console.error("Unknown auth response format:", authResult)
            return null
          }

          console.log("👤 Returning user object:", { ...user, accessToken: "***", refreshToken: "***" })
          return user
        } catch (error) {
          console.error("❌ Auth error:", error)
          
          // Enhanced error logging for debugging
          if (error instanceof Error) {
            console.error("Error message:", error.message)
            console.error("Error stack:", error.stack)
          }
          
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Persist the OAuth account info and user info to the token right after signin
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.tenantId = user.tenantId
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
      }
      
      if (account) {
        token.provider = account.provider
      }

      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.provider = token.provider as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
      }

      return session
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Allow OAuth sign ins
      if (account?.provider === "google" || account?.provider === "github") {
        return true
      }

      // Allow credentials sign in (handled in authorize callback)
      if (account?.provider === "credentials") {
        return true
      }

      return false
    },
    async redirect({ url, baseUrl }) {
      console.log("🔄 NextAuth redirect:", { url, baseUrl })
      
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`
        console.log("✅ Relative redirect:", redirectUrl)
        return redirectUrl
      }
      
      // Allows callback URLs on the same origin
      if (url && new URL(url).origin === new URL(baseUrl).origin) {
        console.log("✅ Same origin redirect:", url)
        return url
      }
      
      // Default redirect to dashboard after successful login
      const defaultUrl = `${baseUrl}/dashboard`
      console.log("🏠 Default redirect:", defaultUrl)
      return defaultUrl
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in with ${account?.provider}`)
      
      // Track sign in event with PostHog
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.identify(user.id, {
          email: user.email,
          name: user.name,
          provider: account?.provider,
        })
        window.posthog.capture('user_signed_in', {
          provider: account?.provider,
          is_new_user: isNewUser,
        })
      }
    },
    async signOut({ session, token }) {
      console.log(`User signed out`)
      
      // Track sign out event
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('user_signed_out')
        window.posthog.reset()
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
})

// Helper function to get server-side session
export async function getServerSession() {
  return await auth()
}

// Types for better TypeScript support
declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    provider?: string
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role?: string
      tenantId?: string
    }
  }

  interface User {
    accessToken?: string
    refreshToken?: string  
    role?: string
    tenantId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    email?: string
    name?: string
    accessToken?: string
    refreshToken?: string
    provider?: string
    role?: string
    tenantId?: string
  }
}