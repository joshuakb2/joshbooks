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
    }),
  ],
  debug: true,
  basePath: new URL(serverEnv.AUTH_URL!).pathname,
  callbacks: {
    session: ({ session }): Session => ({
      ...session,
      user: {
        ...session.user,
        id: session.user.email,
      },
    }),
  },
};
