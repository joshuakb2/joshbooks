'use server';

import type { drive_v3 } from '@googleapis/drive';
import { drive } from '@googleapis/drive';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'node:stream';
import { coalesceResult, Err, getAsyncErrorCatcher, Ok } from '~/util';

export type GoogleAuthTokens = {
  refresh_token: string;
  access_token: string;
};

const catchErrors = getAsyncErrorCatcher('Google Drive error');

export const getGoogleAuth = (credentials: GoogleAuthTokens) => {
  return new OAuth2Client({ credentials });
};

type storeIdentityArgs = {
  identity: string;
  tokens: GoogleAuthTokens;
};

export const storeIdentity = coalesceResult(catchErrors(async ({ identity, tokens }: storeIdentityArgs) => {
  const service = drive({
    version: 'v3',
    auth: getGoogleAuth(tokens),
  });

  const identityFiles = await getIdentityFiles({ service });
  if (!identityFiles.ok) return identityFiles;

  if (identityFiles.value.length > 0) Err('identity-already-exists');

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

  return Ok();
}));

export const getIdentity = coalesceResult(catchErrors(async (tokens: GoogleAuthTokens) => {
  const service = drive({
    version: 'v3',
    auth: getGoogleAuth(tokens),
  });

  const identityFiles = await getIdentityFiles({ service });
  if (!identityFiles.ok) return identityFiles;

  if (identityFiles.value.length === 0) return Ok(null);
  if (identityFiles.value.length > 1) return Err('multiple-identities');

  const identityFile = identityFiles.value[0];

  const response = await service.files.get({
    fileId: identityFile.id!,
    alt: 'media',
  }, {
    responseType: 'stream',
  });

  const buffer = Buffer.concat(await Array.fromAsync(Readable.toWeb(response.data)));

  const identityStr = buffer.toString('utf-8');

  return Ok(identityStr);
}));

type getIdentityFilesArgs = {
  service: drive_v3.Drive;
};

const getIdentityFiles = coalesceResult(catchErrors(async ({ service }: getIdentityFilesArgs) => {
  const files = await service.files.list({ spaces: 'appDataFolder' });
  return Ok(files.data.files?.filter(x => x.name === 'identity') ?? []);
}));

type deleteIdentitiesArgs = {
  tokens: GoogleAuthTokens;
};

export const deleteIdentities = coalesceResult(catchErrors(async ({ tokens }: deleteIdentitiesArgs) => {
  const service = drive({
    version: 'v3',
    auth: getGoogleAuth(tokens),
  });

  const identityFiles = await getIdentityFiles({ service });
  if (!identityFiles.ok) return identityFiles;

  if (identityFiles.value.length >= 0) {
    for (const { id } of identityFiles.value) {
      if (id) {
        await service.files.delete({ fileId: id });
      }
    }
  }

  return Ok();
}));
