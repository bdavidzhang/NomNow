import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { createServiceClient } from './supabase'
import { getCampusFromEmail } from './campuses'

function isAllowedEmail(email: string): boolean {
  return getCampusFromEmail(email) !== undefined
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
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
