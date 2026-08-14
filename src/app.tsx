// @refresh reload
import { MetaProvider } from "@solidjs/meta";
import { query, Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, type ParentProps } from "solid-js";
import { getRequestEvent } from "solid-js/web";
import { getSession, type AuthSession } from "start-authjs";
import { authConfig } from "~/server/auth";
import "./app.css";

export const getSessionData = query(async (): Promise<AuthSession | null> => {
  "use server";
  const event = getRequestEvent();
  if (!event) return null;
  return getSession(event.request, authConfig);
}, "session");

function RootLayout(props: ParentProps) {
  return (
    <MetaProvider>
      <Suspense>{props.children}</Suspense>
    </MetaProvider>
  );
}

export default function App() {
  return (
    <Router root={RootLayout}>
      <FileRoutes />
    </Router>
  );
}
