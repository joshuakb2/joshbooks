import { A, createAsync } from "@solidjs/router";
import { Show, type Component, type JSX } from "solid-js";
import { getSessionData } from "~/queries/getSessionData";

const StandardLayout: Component<{ children: JSX.Element }> = props => {
  const session = createAsync(() => getSessionData());

  return (
    <div class="flex min-h-screen flex-col items-stretch">
      <nav class="flex flex-row flex-none bg-blue-700 justify-center gap-10 p-2">
        <A href="/">Home</A>
        <A href="/books">Your Books</A>
        <Show
          when={session()}
          fallback={<a rel="external" href="/api/auth/signin">Sign in</a>}
        >
          <a rel="external" href="/api/auth/signout">Sign out</a>
        </Show>
      </nav>
      <main class="flex-1">
        {props.children}
      </main>
    </div>
  );
};

export default StandardLayout;
