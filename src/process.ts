import { AppOptionsType, PushOptionsType, RepositoryType } from './types';
import pm2, { Proc, ProcessDescription } from 'pm2';
import { getConfig, getRepoPath, saveConfig, tryCatch } from './util';
import publicIp from 'public-ip';
import { userInfo, homedir } from 'os';
import { readFileSync, existsSync } from 'fs';
import { defaultOptions } from './defaults';

let globalOptions: PushOptionsType;

export async function initCirrus(options: PushOptionsType): Promise<PushOptionsType> {
	if (!existsSync(options.root)) saveConfig(options);
	await connectToPm2(); // Daemonize PM2
	return getGlobalOptions();
}

export const getGlobalOptions = (configPath?: string): PushOptionsType => getConfig(configPath);

async function connectToPm2() {
	return new Promise((resolve) => {
		pm2.connect(resolve);
	});
}

export const getApp = (appName: string): AppOptionsType => {
	const pizza = getGlobalOptions()
		.repos.map((repo: RepositoryType) => repo.apps)
		.reduce((previous, current) => {
			return [...previous, ...current];
		});
	console.log(pizza);
	// @ts-ignore
	return null;
	// pizza
};
//   getGlobalOptions().apps[appName] ?? null;

export const getRepository = (repositoryName: string, options?: PushOptionsType): RepositoryType =>
	(options ?? getGlobalOptions()).repos.find(
		(repo) => repo.repositoryName === repositoryName
	) as RepositoryType;

export const getProcessApp = async (appName: string) =>
	(await listPm2Apps()).filter((app: PartialAppInfo) => app.appName === appName)?.[0];

// From PM2 types
export type ProcessStatus =
	| 'online'
	| 'stopping'
	| 'stopped'
	| 'launching'
	| 'errored'
	| 'one-launch-status';

export type AppInfo = Omit<AppOptionsType, 'env'> & {
	env: string;
};

export interface Pm2AppInfo {
	cpu: number;
	memory: number;
	uptime: number;
	status: ProcessStatus;
}

export interface AppLogs {
	appName: string;
	error: string[];
	log: string[];
}

export type PartialAppInfo = Omit<
	AppInfo,
	'remote' | 'env' | 'script' | 'instances' | 'errorFile' | 'logFile'
>;

export interface RepositoryInfo {
	remote: string;
	port: number[];
}

export async function getRepositoryInfo(repositoryName: string): Promise<RepositoryInfo> {
	const repository = getRepository(repositoryName);
	if (!repository) throw Error(`Repository with name ${repositoryName} does not exist.`);
	// TODO: move this to init…
	const externalIp = await publicIp.v4();
	const remote = repository.remote
		? repository.remote
		: `ssh://${userInfo().username}@${externalIp}${getRepoPath(repositoryName)}`;
	const port = repository.apps.map((app) => app.port);
	return {
		remote,
		port
	};
}

async function getAppInfo(app: AppOptionsType): Promise<AppInfo> {
	const env = Object.entries(app.env ?? {})
		.map(([key, value]) => `${key}=${value}`)
		.join('\n');
	return {
		...app,
		env
	};
}

async function getPm2AppInfo(app: AppOptionsType): Promise<Pm2AppInfo> {
	return new Promise((resolve, reject) => {
		pm2.list((err: Error, procList: ProcessDescription[]) => {
			if (err) reject(err);
			const proc: ProcessDescription | undefined = procList.find(
				(process: ProcessDescription) => process.name === app.appName
			);
			resolve({
				cpu: proc?.monit?.cpu ?? 0,
				memory: proc?.monit?.memory ?? 0,
				uptime: Date.now() - (proc?.pm2_env?.pm_uptime ?? Date.now()),
				status: proc?.pm2_env?.status ?? 'stopped'
			});
		});
	});
}

// TODO: refactor this…
export async function listApps(): Promise<(AppInfo & Pm2AppInfo)[]> {
	const appInfos: (AppInfo & Pm2AppInfo)[] = [];

	for (let i = 0; i < getGlobalOptions().repos.length; i++) {
		const repo = getGlobalOptions().repos[i];
		for (let i = 0; i < repo.apps.length; i++) {
			const appInfo = await getAppInfo(repo.apps[i]);
			const pm2AppInfo = await getPm2AppInfo(repo.apps[i]);
			const combined = { ...appInfo, ...pm2AppInfo };
			appInfos.push(combined);
		}
	}
	/*for (const [, repos] of Object.entries(getGlobalOptions().repos)) {
    for (let i = 0; i < repos.length; i++) {
      const appInfo = await getAppInfo(apps[i]);
      const pm2AppInfo = await getPm2AppInfo(apps[i]);
      const combined = { ...appInfo, ...pm2AppInfo };
      appInfos.push(combined);
    }
  }*/

	return appInfos;
}

export async function getLogs(repositoryName: string): Promise<AppLogs[]> {
	const repository = getRepository(repositoryName);
	if (!repository) throw Error(`Could not find repository with name ${repositoryName}`);
	const logs: AppLogs[] = [];
	for (let i = 0; i < repository.apps.length; i++) {
		const { data: error } = await tryCatch(() =>
			readFileSync(repository.apps[i].errorFile as string)
				?.toString('utf-8')
				?.split('\n')
		);
		const { data: log } = await tryCatch(() =>
			readFileSync(repository.apps[i].logFile as string)
				?.toString('utf-8')
				?.split('\n')
		);
		logs.push({
			appName: repository.apps[i].appName,
			error: error ?? [],
			log: log ?? []
		});
	}

	return logs;
}

export async function listPm2Apps(): Promise<PartialAppInfo[]> {
	return new Promise((resolve, reject) => {
		pm2.list((err: Error, procList: ProcessDescription[]) => {
			if (err) reject(err);
			const fixedList = procList.map((process: ProcessDescription) => {
				return {
					appName: process.name ?? 'no name',
					port: 0,
					cpu: process.monit?.cpu,
					memory: process.monit?.memory,
					uptime: Date.now() - (process.pm2_env?.pm_uptime ?? Date.now()),
					status: process.pm2_env?.status
				};
			});
			resolve(fixedList);
		});
	});
}
