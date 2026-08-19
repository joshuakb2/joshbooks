import { A, createAsync } from "@solidjs/router";
import { Show, type Component, type JSX } from "solid-js";
import { ModalStackContextProvider } from "~/components/Modal";
import { getSessionData } from "~/queries/getSessionData";

const StandardLayout: Component<{ children: JSX.Element }> = props => {
  const session = createAsync(() => getSessionData());
  const user = () => session()?.user;

  return (
    <div class="flex min-h-screen flex-col items-stretch">
      <ModalStackContextProvider>
        <nav class="flex flex-row bg-blue-700 justify-stretch gap-10 p-2 pl-5 pr-5">
          <div class="flex flex-row justify-start gap-10 w-1 flex-1">
            <A href="/">Home</A>
            <A href="/books">Your Books</A>
          </div>
          <div class="flex flex-row justify-end gap-10 w-1 flex-1">
            <Show
              when={user()}
              fallback={<A rel='external' href='/api/auth/signin'>Sign in</A>}
            >
              <A rel='external' href='/api/auth/signout'>Sign out</A>
            </Show>
          </div>
        </nav>
        <main class="flex-1">
          {props.children}
        </main>
      </ModalStackContextProvider>
    </div>
  );
};

export default StandardLayout;
