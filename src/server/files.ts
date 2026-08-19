'use server';

import { serverEnv } from "~/env/server";
import { join } from "node:path";
import { bookParser, newBook } from "~/types/book";
import { Encrypter, Decrypter } from "age-encryption";
import { readFile, rm, writeFile } from "node:fs/promises";
import { coalesceResult, getAsyncErrorCatcher, Ok } from "~/util";

const ROOT = serverEnv.FILES_ROOT;

const bookPath = (id: number) => join(ROOT, 'books', `${id}.json.age`);

const catchErrors = getAsyncErrorCatcher('File error');

type createNewBookFileArgs = {
  id: number;
  name: string;
  owner: string;
  recipient: string;
};

export const createNewBookFile = coalesceResult(catchErrors(async ({ id, name, owner, recipient }: createNewBookFileArgs) => {
  const book = newBook({ id, name, owner });

  const path = bookPath(id);
  const enc = new Encrypter();

  enc.addRecipient(recipient);

  const ciphertext = await enc.encrypt(Buffer.from(JSON.stringify(book), 'utf-8'));

  // Fail if the file already exists
  await writeFile(path, ciphertext, { flag: 'wx' });

  return Ok();
}));

type openBookFileArgs = {
  id: number;
  identity: string;
};

export const openBookFile = coalesceResult(catchErrors(async ({ id, identity }: openBookFileArgs) => {
  const path = bookPath(id);
  const ciphertext = await readFile(path);

  const dec = new Decrypter();
  dec.addIdentity(identity);

  const json = Buffer.from(await dec.decrypt(ciphertext)).toString('utf-8');
  const book = bookParser.parse(JSON.parse(json));

  return Ok(book);
}));

type deleteBookFileArgs = {
  id: number;
};

export const deleteBookFile = coalesceResult(catchErrors(async ({ id }: deleteBookFileArgs) => {
  const path = bookPath(id);
  await rm(path, { force: true });
  return Ok();
}));
