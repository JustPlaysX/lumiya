import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // hinter nginx-Reverse-Proxy
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      // URL explizit setzen, sonst versucht Auth.js OIDC-Discovery über issuer (den Discord nicht hat)
      authorization: {
        url: 'https://discord.com/api/oauth2/authorize',
        params: { scope: 'identify guilds' },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      // Discord-User-ID zuverlässig aus dem Profil übernehmen
      const pid = (profile as { id?: string } | undefined)?.id;
      if (pid) token.discordId = pid;
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      const id = (token.discordId as string | undefined) ?? token.sub;
      if (id) session.user.id = id;
      return session;
    },
  },
});
