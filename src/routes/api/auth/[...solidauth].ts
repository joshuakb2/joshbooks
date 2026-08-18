import type { AuthRequestContext } from "start-authjs";
import { StartAuthJS } from "start-authjs";
import { authConfig } from "~/server/auth";

const { GET: AuthGET, POST: AuthPOST } = StartAuthJS(authConfig);

export const GET = (event: AuthRequestContext) => {
  fixRequestUrl(event.request);
  return AuthGET({ request: event.request, response: new Response() });
};

export const POST = (event: AuthRequestContext) => {
  fixRequestUrl(event.request);
  return AuthPOST({ request: event.request, response: new Response() });
};

// auth.js is supposed to honor x-forwarded-host and x-forwarded-proto,
// but in most cases it actually doesn't. So we'll give it a fib instead.
const fixRequestUrl = (request: Request) => {
  try {
    const url = new URL(request.url);

    const host = request.headers.get('x-forwarded-host');
    if (host) url.host = host;

    const proto = request.headers.get('x-forwarded-proto');
    if (proto) url.protocol = proto;

    Object.defineProperty(request, 'url', { value: url.href });
  }
  catch { }
}
