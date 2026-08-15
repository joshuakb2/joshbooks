// @refresh reload
import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, type ParentProps } from "solid-js";
import "./app.css";

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
