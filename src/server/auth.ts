import Google from "@auth/core/providers/google";
import type { StartAuthJSConfig } from "start-authjs";
import { serverEnv } from "~/env/server";

export const authConfig: StartAuthJSConfig = {
  secret: serverEnv.AUTH_SECRET,
  providers: [
    Google({
        clientId: serverEnv.GOOGLE_ID,
        clientSecret: serverEnv.GOOGLE_SECRET,
    }),
  ],
  debug: false,
  basePath: new URL(serverEnv.AUTH_URL!).pathname,
};
