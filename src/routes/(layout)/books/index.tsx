import { Title } from "@solidjs/meta";
import { A, action, createAsync, useAction } from "@solidjs/router";
import { assertNever } from '~/util';
import { createSignal, For, Show } from "solid-js";
import { useModal } from "~/components/Modal";
import { deleteBook } from "~/server/db";
import { createNewBook } from "~/actions/createNewBook";
import { getBooksForUser } from "~/queries/getBooksForUser";
import { getSessionData } from "~/queries/getSessionData";

const deleteBookAction = action(async (id: number) => {
  'use server';

  const session = await getSessionData();
  if (!session?.user?.id) return;

  return await deleteBook({
    book_id: id,
    user_id: session.user.id,
  });
}, 'delete-book');

export default function BooksPage() {
  const books = createAsync(() => getBooksForUser());
  const createBook = useAction(createNewBook);
  const deleteBook = useAction(deleteBookAction);
  const { modal, showModal } = useModal();

  const showCreateBookModal = async () => {
    const [name, setName] = createSignal('');

    const [answer, result] = await showModal({
      title: 'Create new book',
      content: <label>Book name: <input ref={i => i.focus()} type='text' onInput={e => setName(e.target.value)} /></label>,
      options: [
        {
          id: 'accept',
          label: 'Create book',
          class: 'button-success',
          getResult: () => {
            const n = name();
            if (!n) return null;
            return { result: { name: n } };
          },
        },
        {
          id: 'cancel',
          label: 'Cancel',
          class: 'btn-error',
        },
      ],
    });

    switch (answer) {
      case 'cancel': return;
      case 'accept':
        await createBook(result);
        break;
      default:
        return assertNever(answer);
    }
  };

  return <>
    <Title>Your Books</Title>
    <h1 class='font-bold text-2xl text-center m-3'>Your Books</h1>
    <Show
      when={books()}
      fallback='Loading...'
    >{
      books =>
        <ul>
          <For
            each={books()}
            fallback={<li>You have no books available.</li>}
          >{
            book => <li>
              {book.id} ({JSON.stringify(book.name)}) owned by {book.owner}: {book.access}
              <button class='btn btn-sm btn-link'><A href={`/books/${book.id}`}>Open</A></button>
              <button class='btn btn-sm btn-error' onClick={areYouSure(() => deleteBook(book.id))}>Delete</button>
            </li>
          }</For>
        </ul>
    }</Show>
    <button class='btn btn-sm btn-primary' onClick={showCreateBookModal}>
      Create new book
    </button>
    {modal}
  </>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const areYouSure = <ScaryThing extends (...args: readonly any[]) => unknown>(scaryThing: ScaryThing) => (...args: any[]) => {
  if (confirm('Are you sure you want to proceed?')) {
    return scaryThing(...args);
  }
};
