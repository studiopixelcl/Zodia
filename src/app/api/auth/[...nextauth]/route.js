import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const runtime = 'edge';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "mock_id",
      clientSecret: process.env.GOOGLE_SECRET || "mock_secret",
    }),
    CredentialsProvider({
      name: "Acceso Terrenal",
      credentials: {
        name: { label: "Nombre", type: "text" },
        dob: { label: "Fecha de Origen", type: "text" }
      },
      async authorize(credentials) {
        if (credentials?.name?.trim()) {
          const trimmedName = credentials.name.trim();
          const userId = "tuner_" + trimmedName.toLowerCase().replace(/\s+/g, '');
          const dob = credentials.dob || '2000-01-01';
          
          return { 
            id: userId, 
            name: trimmedName, 
            email: `${userId}@zodia.eter`,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=06b6d4&color=fff&bold=true`,
            dob: dob
          };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt", 
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.dob = user.dob;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.dob = token.dob;
      }
      return session;
    },
  },
  pages: {
    signIn: '/', 
  },
});

export { handler as GET, handler as POST };