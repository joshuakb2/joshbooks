import { serverScheme } from "./schema";
import type { ZodFormattedError } from "zod";

export const formatErrors = (
  errors: ZodFormattedError<Map<string, string>, string>
) =>
  Object.entries(errors)
    .map(([name, value]) => {
      if (value && "_errors" in value)
        return `${name}: ${value._errors.join(", ")}\n`;
    })
    .filter(Boolean);

const env = serverScheme.safeParse(process.env);

if (env.success === false) {
  throw new Error(
    "Invalid environment variables:\n" + formatErrors(env.error.format()).join('')
  );
}

export const serverEnv = env.data;
