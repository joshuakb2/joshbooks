'use server';

export {};

declare module '@auth/core/types' {
  interface Session {
    user: User & {
      id: string;
    };
  }
}
