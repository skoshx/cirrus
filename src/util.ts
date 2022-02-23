// Utils
import { deepStrictEqual } from 'assert';

export function getDefaultEnvironment() {
  return {
    NODE_ENV: 'production',
  };
}

export interface TryCatchResponse<T = unknown> {
  data: T | null;
  error: any;
}

/**
 * Convenience function for catching async/sync functions that might throw errors.
 *
 * Example:
 * ```typescript
 * import { readFileSync } from 'fs';
 * import { readFile } from 'fs/promises';
 *
 * // Sync example
 * const { data, error } = await tryCatch<Buffer>(() => readFileSync('./nonexistant'));
 * // Async example
 * const { data, error } = await tryCatch<Buffer>(readFile('./nonexistent'));
 * ```
 * @param fn The function to catch. If the function isn't a `Promise`, we need to wrap it with `() => function()`
 * @returns { TryCatchResponse<T> } An object with keys `data` & `error`.
 */
export async function tryCatch<T = unknown>(
  fn: (() => T) | Promise<T> | (() => Promise<T> | T),
): Promise<TryCatchResponse<T>> {
  try {
    return { data: fn instanceof Promise ? await fn : await fn(), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Use NodeJS built in functionality for checking value equality
export async function deepEqual(a: any, b: any) {
  const { error } = await tryCatch(() => deepStrictEqual(a, b));
  return error === null;
}

// fix title if it has spaces
export const checkTitle = (title?: string) => title?.replace(' ', '');

export const clone = (a: any) => JSON.parse(JSON.stringify(a));

export const camelCase = (input: string) =>
  input
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replace(/\s+/g, '');
