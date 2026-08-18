import { createEffect, createSignal, type Component, type JSX } from "solid-js";
import BookContext, { getBookWrapper } from "./BookContext";
import { useParams } from "@solidjs/router";
import type { Book } from "~/types/book";
import { getBook } from "~/queries/getBook";

const BookLayout: Component<{ children?: JSX.Element }> = props => {
  const params = useParams();
  const bookId = () => +(params.book_id ?? '');
  const [book, setBook] = createSignal<Book | null>(null);

  createEffect(() => getBook(bookId()).then(setBook));

  // eslint-disable-next-line solid/reactivity
  return <BookContext.Provider value={getBookWrapper(book, setBook)}>
    {props.children}
  </BookContext.Provider>;
};

export default BookLayout;
