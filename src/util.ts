// Utils
import { deepStrictEqual } from 'assert';
import { execaCommandSync, SyncOptions } from 'execa';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { getRootCirrusPath } from './defaults';
import { getCirrusLogger } from './logger';
import { getDeployments } from './project';
import { Deployment, Project, ProjectSchema } from './types';

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

export function executeCommandOrCatch(command: string, options?: SyncOptions<string>) {
	getCirrusLogger().info(`executing command "${command}"`);
	const { data, error } = tryCatchSync(() => execaCommandSync(command, options));
	if (error) {
		getCirrusLogger().error(
			`An error occurred while executing command "${command}". If this problem persists, please open an issue on GitHub.`,
			{ error }
		);
		return null;
	}
	return data;
}

export async function getAvailablePort() {
	const takenPorts = (await getDeployments()).map((deployment) => deployment.port);
	const isTaken = (port: number) => takenPorts.includes(port);
	// TODO: fix this naïve approach of checking if port taken
	let port = 3000;
	while (isTaken(port)) port++;
	return port;
}

export function getConfigFromPath(path: string) {
	const { data } = tryCatchSync(() => readFileSync(path, 'utf-8').toString());
	if (!data) return null;
	return ProjectSchema.parse(JSON.parse(data));
}

export function writeConfig(projectName: string, config: Project) {
	if (!existsSync(join(getRootCirrusPath(), 'config')))
		mkdirSync(join(getRootCirrusPath(), 'config'), { recursive: true });
	writeFileSync(join(getRootCirrusPath(), 'config', `${projectName}.json`), JSON.stringify(config));
}

export function getProjectPackageManager(projectName: string) {
	const files = readdirSync(getWorkingDir(projectName), { withFileTypes: true }).map(
		(ent) => ent.name
	);

	if (files.indexOf('package-lock.json') !== -1) return 'npm';
	if (files.indexOf('yarn.json') !== -1) return 'yarn';
	if (files.indexOf('pnpm-lock.yaml') !== -1) return 'pnpm';
}

export const getInstallCommand = (projectName: string) =>
	`${getProjectPackageManager(projectName)} install`;
export const getBuildCommand = (projectName: string) =>
	`${getProjectPackageManager(projectName)} run build`;
export const getStartCommand = (projectName: string) =>
	`${getProjectPackageManager(projectName)} run start`;
