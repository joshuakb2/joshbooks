import type { Accessor, Setter } from "solid-js";
import { createContext } from "solid-js";
import type { Account, Book } from "~/types/book";

export const getBookWrapper = (book: Accessor<Book | null>, setBook: Setter<Book | null>) => {
  return {
    book,
    createAccount: (newAccount: Omit<Account, 'id'>) => setBook(book => book && ({
      ...book,
      accounts: {
        items: [
          ...book.accounts.items,
          { ...newAccount, id: book.accounts.nextId },
        ],
        nextId: book.accounts.nextId + 1,
      },
    })),
  };
};

export type BookWrapper = ReturnType<typeof getBookWrapper>;

const BookContext = createContext<BookWrapper>(getBookWrapper(() => null, () => {}));

export default BookContext;
