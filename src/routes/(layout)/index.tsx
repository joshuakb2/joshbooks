import { createAsync } from "@solidjs/router";
import { Show, Suspense, type VoidComponent } from "solid-js";
import { getSessionData } from "~/queries/getSessionData";

const Home: VoidComponent = () => {
  return (
      <div class="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <AuthShowcase />
      </div>
  );
};

export default Home;

const AuthShowcase: VoidComponent = () => {
  const session = createAsync(() => getSessionData());

  return (
    <div class="flex flex-col items-center justify-center gap-4">
      <Suspense fallback={<div class="">Loading...</div>}>
        <Show
          when={session()}
          fallback={
            <a
              rel="external"
              href="/api/auth/signin"
              class="rounded-full px-10 py-3 font-semibold no-underline transition"
            >
              Sign in
            </a>
          }
        >
        {session =>
          <div class="flex flex-col gap-3 items-center">
            <span class="text-xl">
              Welcome {session().user?.name}
            </span>
            <a
              rel="external"
              href="/api/auth/signout"
              class="rounded-full px-10 py-3 font-semibold no-underline transition"
            >
              Sign out
            </a>
          </div>
        }
        </Show>
      </Suspense>
    </div>
  );
};
