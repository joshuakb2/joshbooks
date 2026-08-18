import type { Accessor, Setter } from "solid-js";
import { createContext } from "solid-js";
import { produce } from "solid-js/store";
import type { Account, Book } from "~/types/book";

export const getBookWrapper = (book: Accessor<Book | null>, setBook: Setter<Book | null>) => {
  return {
    book,
    createAccount: (newAccount: Omit<Account, 'id'>) => setBook(produce(book => {
      book?.accounts.items.push({ ...newAccount, id: book.accounts.nextId++ });
    })),
  };
};

export type BookWrapper = ReturnType<typeof getBookWrapper>;

const BookContext = createContext<BookWrapper>(getBookWrapper(() => null, () => {}));

export default BookContext;
