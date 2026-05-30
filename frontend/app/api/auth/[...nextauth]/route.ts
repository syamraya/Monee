import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/auth/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email:    credentials?.email,
              password: credentials?.password,
            }),
          },
        );

        const data = await res.json();
        console.log("AUTH DATA:", data);

        if (!res.ok || !data?.user) return null;

        // Mapping eksplisit — pastikan role selalu terbaca
        return {
          id:          data.user.id,
          name:        data.user.name,
          email:       data.user.email,
          role:        data.user.role,
          balance:     data.user.balance,
          accessToken: data.access_token,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // `user` hanya ada saat pertama kali login
      if (user) {
        token.id          = user.id;
        token.role        = (user as any).role;
        token.balance     = (user as any).balance;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id          = token.id          as string;
      session.user.role        = token.role        as string;
      session.user.balance     = token.balance     as number;
      session.user.accessToken = token.accessToken as string;
      return session;
    },
  },

  pages: {
    signIn: "/sign-in",
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };