import { type VoidComponent } from "solid-js";
import { useModalStack } from "~/components/Modal";

const Home: VoidComponent = () => {
  const { showModal } = useModalStack();

  const startModalStack = () => showCounter(1);
  const showCounter = (n: number) => {
    showModal({
      title: `Modal #${n}`,
      content: <>
        <p>This is modal #{n}</p>
        <p>
          <button
            class='btn'
            onClick={() => showCounter(n + 1)}
          >Open another</button>
        </p>
      </>,
      options: ['Ok'],
      ref: dialog => {
        setTimeout(() => {
          [...dialog.querySelectorAll('button')].at(-1)?.click();
        }, 5000);
      },
    }).then(() => console.log('Done with #' + n));
  };

  return (
      <div class="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
        <button class='btn' onClick={startModalStack}>Start modal stack</button>
      </div>
  );
};

export default Home;
