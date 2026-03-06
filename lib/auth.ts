import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { createServiceClient } from './supabase'
import { getCampusFromEmail, getAllCampuses } from './campuses'

function isAllowedEmail(email: string): boolean {
  return getCampusFromEmail(email) !== undefined
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
          // When only one campus, hint Google to show only that domain's accounts
          ...(getAllCampuses().length === 1 ? { hd: getAllCampuses()[0].emailDomain } : {}),
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email || !isAllowedEmail(user.email)) {
        return '/login?error=unauthorized'
      }
      // Upsert user into Supabase
      const campus = getCampusFromEmail(user.email)
      const db = createServiceClient()
      await db.from('users').upsert(
        {
          email: user.email,
          name: user.name ?? null,
          avatar_url: user.image ?? null,
          school: campus?.id ?? null,
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
          .select('id, school')
          .eq('email', session.user.email)
          .single()
        if (data) {
          session.user.id = data.id
          session.user.campus = data.school ?? null
        }
      }
      return session
    },
    async jwt({ token, account }) {
      return token
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
