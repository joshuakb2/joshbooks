'use server';

import Google from "@auth/core/providers/google";
import type { Session, StartAuthJSConfig } from "start-authjs";
import { serverEnv } from "~/env/server";

export const authConfig: StartAuthJSConfig = {
  secret: serverEnv.AUTH_SECRET,
  // All providers must specify a user id string!
  providers: [
    Google({
      clientId: serverEnv.GOOGLE_ID,
      clientSecret: serverEnv.GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/drive.appdata",
        }
      },
    }),
  ],
  debug: true,
  basePath: new URL(serverEnv.AUTH_URL!).pathname,
  trustHost: true,
  callbacks: {
    jwt: async ({ token, account }) => {
      const { access_token, refresh_token } = account ?? {};
      if (access_token && refresh_token) {
        token.tokens = { access_token, refresh_token };
      }
      return token;
    },
    session: ({ session, token }): Session => {
      session.user.id = session.user.email;
      session.user.tokens = token.tokens;
      return session;
    },
  },
};
