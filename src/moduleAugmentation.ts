import type { GoogleAuthTokens } from "./server/google";

declare module '@auth/core/types' {
  interface Session {
    user: User & {
      id: string;
      tokens?: GoogleAuthTokens;
    };
  }
}

declare module 'start-authjs' {
  interface AuthUser {
    tokens?: GoogleAuthTokens;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    tokens?: GoogleAuthTokens;
  }
}
