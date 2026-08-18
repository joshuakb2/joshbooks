import { query } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import type { AuthSession } from "start-authjs";
import { getSession } from "start-authjs";
import { authConfig } from "~/server/auth";

export const getSessionData = query(async (): Promise<AuthSession | null> => {
  "use server";

  const event = getRequestEvent();
  if (!event) return null;
  return getSession(event.request, authConfig);
}, "session");

