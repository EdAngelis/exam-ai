import NextAuth, { User as NextAuthUser } from "next-auth";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createUser, getUser } from "./service/user.service";
import { signInService, googleSignInService } from "./service/auth.service";

interface User extends NextAuthUser {
  level?: number;
  backendToken?: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        let resp;
        try {
          if (credentials) {
            resp = await signInService({
              email: credentials.email as string,
              password: credentials.password as string,
            });
            if (resp.data) {
              return {
                id: resp.data.id,
                email: resp.data.email,
                name: resp.data.name,
                level: resp.data.level,
                backendToken: resp.token,
              };
            }
          }
          return null;
        } catch (error) {
          console.error("Error during credential sign-in:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    signIn: async ({ user }) => {
      try {
        if (user.email && user.name && user.id) {
          await createUser({
            email: user.email,
            name: user.name,
            id: user.id,
          });
          return true;
        }
      } catch (error) {
        console.error("Error creating user:", error);
      } finally {
        return true;
      }
    },
    session: async ({ session, token }) => {
      try {
        if (session.user.email && !token.level) {
          const userDataBase = await getUser(session.user.email);
          if (userDataBase) {
            (session.user as User).level = userDataBase.level;
          }
        }
        if (typeof token.level === "number") {
          (session.user as User).level = token.level;
        }
        if (typeof token.backendToken === "string") {
          (session.user as User).backendToken = token.backendToken;
        }
      } catch (error) {
        console.error("Error fetching user level:", error);
      }
      return session;
    },
    jwt: async ({ token, user, account }) => {
      if (user) {
        token.id = user.id;
        token.level = (user as User).level;
        if ((user as User).backendToken) {
          token.backendToken = (user as User).backendToken;
        }
      }
      // Google logins never reach `authorize`, so there is no backend JWT yet —
      // mint one here from the Google ID token NextAuth received. This only
      // runs on first sign-in (account is only populated then); the token
      // it caches has the same 1h lifetime as the backend session and, unlike
      // mobile, this app has no refresh flow, so a Google-signed-in user will
      // need to re-authenticate after ~1h of proxy calls returning 401.
      if (account?.provider === "google" && account.id_token) {
        try {
          const resp = await googleSignInService(account.id_token);
          if (resp.token) {
            token.backendToken = resp.token;
          }
        } catch (error) {
          console.error("Error minting backend token for Google user:", error);
        }
      }
      return token;
    },
  },
});
