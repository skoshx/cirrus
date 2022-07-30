// Utils
import { deepStrictEqual } from 'assert';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getRootCirrusPath } from './defaults';
import { Deployment } from './types';

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
	fn: (() => T) | Promise<T> | (() => Promise<T> | T)
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

export const getLogFilePath = (deployment: Deployment) =>
	join(getRootCirrusPath(), 'logs', deployment.name, deployment.logFilePath ?? `stdout.log`);
export const getErrorLogFilePath = (deployment: Deployment) =>
	join(getRootCirrusPath(), 'logs', deployment.name, deployment.errorLogFilePath ?? `stderr.log`);

export const getWorkingDir = (projectName: string) => join(getRootCirrusPath(), projectName);

export function createDirectory(path: string) {
	if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

export function readFileOrCreate(path: string) {
	const { data } = tryCatchSync(() => readFileSync(path, 'utf-8'));
	if (data) return data.toString();
	writeFileSync(path, '', 'utf-8');
	return '';
}
