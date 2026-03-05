import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { createServiceClient } from './supabase'

const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS ?? '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean)

function isAllowedEmail(email: string): boolean {
  if (allowedDomains.length === 0) return true // dev: allow all
  const domain = email.split('@')[1]?.toLowerCase()
  return allowedDomains.includes(domain)
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email || !isAllowedEmail(user.email)) {
        return '/login?error=unauthorized'
      }
      // Upsert user into Supabase
      const db = createServiceClient()
      await db.from('users').upsert(
        {
          email: user.email,
          name: user.name ?? null,
          avatar_url: user.image ?? null,
        },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const db = createServiceClient()
        const { data } = await db
          .from('users')
          .select('id')
          .eq('email', session.user.email)
          .single()
        if (data) {
          session.user.id = data.id
        }
      }
      return session
    },
    async jwt({ token, account }) {
      return token
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
