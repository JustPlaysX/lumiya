import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // hinter nginx-Reverse-Proxy
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      authorization: { params: { scope: 'identify guilds' } },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
