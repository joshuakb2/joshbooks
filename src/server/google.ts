'use server';

import type { drive_v3 } from '@googleapis/drive';
import { drive } from '@googleapis/drive';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'node:stream';

export type GoogleAuthTokens = {
  refresh_token: string;
  access_token: string;
};

export const getGoogleAuth = (credentials: GoogleAuthTokens) => {
  return new OAuth2Client({ credentials });
};

type storeIdentityArgs = {
  identity: string;
  tokens: GoogleAuthTokens;
};

export const storeIdentity = async ({ identity, tokens }: storeIdentityArgs) => {
  console.log('store identity');

  const service = drive({
    version: 'v3',
    auth: getGoogleAuth(tokens),
  });

  const identityFiles = await getIdentityFiles({ service });

  console.log('got identity files', identityFiles);
  if (identityFiles && identityFiles.length > 0) {
    console.log('at least one identity already exists, don\'t make another!');
    return;
  }

  console.log('about to create identity file in drive');
  try {
    await service.files.create({
      requestBody: {
        name: 'identity',
        parents: ['appDataFolder'],
      },
      media: {
        mimeType: 'text/plain',
        body: Readable.from(Buffer.from(identity, 'utf-8')),
      },
    });
    console.log('created drive file');
  }
  catch (e) {
    console.log('failed to create identity file in drive', e);
  }
};

export const getIdentity = async (tokens: GoogleAuthTokens) => {
  const service = drive({
    version: 'v3',
    auth: getGoogleAuth(tokens),
  });

  let identityFiles;
  try {
    identityFiles = await getIdentityFiles({ service });
  }
  catch (e) {
    console.log(e);
    return null;
  }

  console.log('identity files', identityFiles);
  if (!identityFiles || identityFiles.length === 0) return null;
  if (identityFiles.length > 1) throw new Error('Multiple identity files');

  const identityFile = identityFiles[0];

  try {
    const response = await service.files.get({
      fileId: identityFile.id!,
      alt: 'media',
    }, {
      responseType: 'stream',
    });

    const buffer = Buffer.concat(await Array.fromAsync(Readable.toWeb(response.data)));

    const identityStr = buffer.toString('utf-8');
    console.log('identityStr: ' + identityStr);
    return identityStr;
  }
  catch (e) {
    console.log('error getting content of identity file', e);
    return null;
  }
};

type getIdentityFilesArgs = {
  service: drive_v3.Drive;
};

const getIdentityFiles = async ({ service }: getIdentityFilesArgs) => {
  const files = await service.files.list({
    spaces: 'appDataFolder',
  });

  return files.data.files?.filter(x => x.name === 'identity');
};

type deleteIdentitiesArgs = {
  tokens: GoogleAuthTokens;
};

export const deleteIdentities = async ({ tokens }: deleteIdentitiesArgs) => {
  console.log('delete identities');

  const service = drive({
    version: 'v3',
    auth: getGoogleAuth(tokens),
  });

  const identityFiles = await getIdentityFiles({ service });

  console.log('got identity files', identityFiles);
  if (identityFiles && identityFiles.length >= 0) {
    for (const { id } of identityFiles) {
      if (id) {
        await service.files.delete({ fileId: id });
      }
    }
  }
  console.log('deleted identity files');
};
