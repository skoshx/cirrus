// Utils
import { deepStrictEqual } from 'assert';
import { AppOptionsType, PushOptions, PushOptionsType } from './types';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { AppInfo, getGlobalOptions, listApps } from './process';
import { join } from 'path';
import { defaultOptions } from './defaults';

export async function isPortAvailable(port: number) {
  const takenPorts = [];
  const options = getGlobalOptions();
  for (const [, value] of Object.entries(options.apps)) {
    takenPorts.push(...value.map((app) => app.port));
  }
  return takenPorts.includes(port);
}

export async function getAvailablePort(port?: number): Promise<number> {
  if (port && !isPortAvailable(port)) throw Error(`Cannot use port ${port}, as it is used by another app.`);
  port = 3000;
  while (!isPortAvailable(port)) port++;
  return port;
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
export function tryCatchSync<T = unknown>(fn: () => T): TryCatchResponse<T> {
  try {
    return { data: fn(), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

// Use NodeJS built in functionality for checking value equality
export async function deepEqual(a: any, b: any) {
  const { error } = tryCatchSync(() => deepStrictEqual(a, b));
  return error === null;
}

export function saveConfig(config: PushOptionsType) {
  config = PushOptions.parse(config);
  mkdirSync(config.root, { recursive: true });
  writeFileSync(
    join(config.root, '.cirrusrc'),
    JSON.stringify(config, null, 2),
  );
}

export function getConfig(
  configPath: string = defaultOptions.root,
): PushOptionsType {
  if (!configPath) throw Error(`Called getConfig() without initializing Cirrus. Please call initCirrus() before using any Cirrus functions.`);
  const { data } = tryCatchSync(() => readFileSync(join(configPath, '.cirrusrc'), 'utf-8'));
  return data ? JSON.parse(data) : { ...defaultOptions, root: configPath };
}

export const getWorkPath = (appName: string) =>
  join(getGlobalOptions().root, 'apps', appName);
export const getRepoPath = (appName: string) =>
  join(getGlobalOptions().root, 'repos', appName + '.git');
export const getLogPath = (appName: string) =>
  join(getGlobalOptions().root, 'logs', appName);
