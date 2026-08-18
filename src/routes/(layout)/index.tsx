import { type VoidComponent } from "solid-js";

const Home: VoidComponent = () => {
  return (
      <div class="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <AuthShowcase />
      </div>
  );
};

export default Home;

const AuthShowcase: VoidComponent = () => {
  return (
    <div class="flex flex-col items-center justify-center gap-4" />
  );
};
