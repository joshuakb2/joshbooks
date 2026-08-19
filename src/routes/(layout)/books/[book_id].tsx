import { createEffect, createSignal, type Component, type JSX } from "solid-js";
import BookContext, { getBookWrapper } from "./BookContext";
import { useParams } from "@solidjs/router";
import type { Book } from "~/types/book";
import { getBook } from "~/queries/getBook";
import { createUnloadPreventer } from "~/util";

const BookLayout: Component<{ children?: JSX.Element }> = props => {
  const params = useParams();
  const bookId = () => +(params.book_id ?? '');
  const [book, setBook] = createSignal<Book | null>(null);
  const [savedBook, setOriginalBook] = createSignal<Book | null>(null);

  createEffect(() => getBook(bookId()).then(r => {
    if (r.ok) {
      setOriginalBook(r.value);
      setBook(r.value);
    }
    else setBook(null);
  }));

  const unloadPreventer = createUnloadPreventer('Your book has unsaved changes');

  createEffect(() => {
    if (book() !== savedBook()) {
      unloadPreventer.enable();
    }
    else {
      unloadPreventer.disable();
    }
  });

  // eslint-disable-next-line solid/reactivity
  return <BookContext.Provider value={getBookWrapper(book, setBook)}>
    {props.children}
  </BookContext.Provider>;
};

export default BookLayout;
