// Pod2 - Improved Pod

// What we need:

// Environments for every app…
// Optional?? setup postgres
// Caddy server

// Firewalls

import { env } from 'process';
import { homedir, userInfo } from 'os';
import { writeFileSync, readFileSync, mkdirSync, chmodSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec as execSync } from 'child_process';
import { promisify } from 'util';
const exec = promisify(execSync);
import pm2, { Proc, ProcessDescription, StartOptions } from 'pm2';
import publicIp from 'public-ip';

import { getDefaultGlobalEnvironment, tryCatch } from './util';
import { log, logError, LogLevels } from './logger';
import {
  AppOptions,
  AppOptionsType,
  PushOptions,
  PushOptionsType,
} from './types';

async function connectToPm2() {
  return new Promise((resolve) => {
    pm2.connect(resolve);
  });
}

export const defaultOptions: PushOptionsType = {
  root:
    process.env.CIRRUS_CONF ?? join(process.env.HOME ?? homedir(), 'cirrus'),
  env: getDefaultGlobalEnvironment(),
  minUptime: 3600000,
  maxRestarts: 10,
  apps: [],
};

export let globalOptions: PushOptionsType;

export async function ready() {
  if (globalOptions) return globalOptions;
  globalOptions = {
    ...defaultOptions,
    ...(await getConfig(defaultOptions)),
  };
  // Daemonize PM2
  await connectToPm2();
}

export const getApp = (appName: string | undefined) =>
  globalOptions.apps.filter(
    (app: AppOptionsType) => app.appName === appName,
  )?.[0];

export const getProcessApp = async (appName: string | undefined) => (await listPm2Apps()).filter((app: PartialAppInfo) => app.appName === appName)?.[0];

// Do setup…
// TODO: Setup with different options, we can automatically setup postgres
// caddy server etc…
export async function install() {}

export async function createApp(
  appName: string,
  options: AppOptionsType,
): Promise<AppOptionsType> {
  options = AppOptions.parse(options);
  if (getApp(appName)) throw Error(`App with name ${appName} exists already.`);

  globalOptions.apps.push(options);
  saveConfig(globalOptions);

  const { error } = await tryCatch<boolean>(
    options.remote
      ? createRemoteApp(appName, options)
      : createAppRepo(appName, options),
  );
  if (error) throw error;

  // Return created app
  return getApp(appName);
}

export async function startApp(appName: string, options?: AppOptionsType) {
  if (options) options = AppOptions.parse(options);
  return new Promise((resolve, reject) => {
    const app = getApp(appName);
    if (!app) reject(`App with name ${appName} does not exist.`);

    console.log("environment : ");
    console.log({
      ...globalOptions.env,
      ...app.env,
      ...options?.env,
    });

    const processOptions: StartOptions = {
      name: appName,
      // script: 'npm',
      script: `${join(getWorkPath(appName), app.script)}`,
      // args: 'start',
      min_uptime: globalOptions.minUptime,
      max_restarts: globalOptions.maxRestarts,
      output: options?.logFile ?? app.logFile,
      error: options?.errorFile ?? app.errorFile,
      cwd: getWorkPath(appName),
      env: {
        ...globalOptions.env,
        ...app.env,
        ...options?.env,
      },
    };

    pm2.start(processOptions, (err: Error, proc: Proc) => {
      if (err) reject(err);
      resolve(proc);
    });
  });
}

export async function removeApp(appName: string) {
  return new Promise((resolve, reject) => {
    if (!getApp(appName))
      throw Error(`App with name ${appName} does not exist.`);
    pm2.delete(appName, (err: Error, proc: Proc) => {
      if (err) reject(err);
      // Remove app from globalOptions
      globalOptions.apps = globalOptions.apps.filter(
        (app: AppOptionsType) => app.appName !== appName,
      );
      // Remove folders
      rmSync(getWorkPath(appName), { recursive: true, force: true });
      rmSync(getRepoPath(appName), { recursive: true, force: true });

      saveConfig(globalOptions);
      resolve(proc);
    });
  });
}

export async function stopApp(appName: string) {
  return new Promise(async (resolve, reject) => {
    if (!getApp(appName))
      return log(`App with name ${appName} does not exist.`, LogLevels.WARNING);
    
    const app = await getProcessApp(appName);
    if (!app) resolve(null);

    pm2.stop(appName, (err: Error, proc: Proc) => {
      if (err) reject(err);
      resolve(proc);
    });
  });
}

// From PM2 types
export type ProcessStatus =
  | 'online'
  | 'stopping'
  | 'stopped'
  | 'launching'
  | 'errored'
  | 'one-launch-status';

export interface AppInfo {
  appName: string;
  port: number;
  cpu?: number;
  memory?: number;
  uptime: number;
  status?: ProcessStatus;

  remote: string;
  env: string;
  script?: string;
  instances?: number;
  errorFile: string;
  logFile: string;
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

export async function listApps(): Promise<AppInfo[]> {
  const pm2Apps = await listPm2Apps();
  // TODO: move these out of here…
  const externalIp = await publicIp.v4();
  return globalOptions.apps.map((app: AppOptionsType) => {
    const pm2App = pm2Apps.filter(
      (pm2App: PartialAppInfo) => pm2App.appName === app.appName,
    )?.[0];
    const env = Object.entries(app.env ?? {})
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    return {
      appName: app.appName,
      port: app.port,
      cpu: pm2App?.cpu,
      memory: pm2App?.memory,
      uptime: pm2App?.uptime ?? 0,
      status: pm2App?.status,

      remote: app.remote
        ? app.remote
        : `ssh://${userInfo().username}@${externalIp}${getRepoPath(
            app.appName,
          )}`,
      env,
      script: app.script,
      instances: app.instances,
      errorFile: app.errorFile,
      logFile: app.logFile,
    };
  });
}

export async function getLogs(appName: string): Promise<AppLogs> {
  const app = getApp(appName);
  if (!app) throw Error(`Could not find app with name ${appName}`);
  const { data: error } = await tryCatch(() =>
    readFileSync(app.errorFile)?.toString('utf-8')?.split('\n'),
  );
  const { data: log } = await tryCatch(() =>
    readFileSync(app.logFile)?.toString('utf-8')?.split('\n'),
  );
  return { appName: app.appName, error: error ?? [], log: log ?? [] };
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
          status: process.pm2_env?.status,
        };
      });
      resolve(fixedList);
    });
  });
}

export function saveConfig(config: PushOptionsType) {
  config = PushOptions.parse(config);
  mkdirSync(config.root, { recursive: true });
  writeFileSync(
    join(config.root, '.cirrusrc'),
    JSON.stringify(config, null, 2),
  );
}

export async function getConfig(
  config: PushOptionsType,
): Promise<PushOptionsType> {
  config = PushOptions.parse(config);
  const { data } = await tryCatch(() =>
    readFileSync(join(config.root, '.cirrusrc'), 'utf-8'),
  );
  return data ? JSON.parse(data) : defaultOptions;
}

export const getWorkPath = (appName: string) =>
  join(defaultOptions.root, 'apps', appName);
export const getRepoPath = (appName: string) =>
  join(defaultOptions.root, 'repos', appName + '.git');
export const getLogPath = (appName: string) =>
  join(defaultOptions.root, 'logs', appName);

export async function createRemoteApp(
  appName: string,
  options: AppOptionsType,
): Promise<boolean> {
  options = AppOptions.parse(options);
  const { stderr } = await exec(
    `git clone ${options.remote} \"${getWorkPath(appName)}\"`,
  );
  if (stderr) throw stderr;
  return true;
}

export async function createAppRepo(
  appName: string,
  options: AppOptionsType,
): Promise<boolean> {
  options = AppOptions.parse(options);
  // Create directory
  mkdirSync(getRepoPath(appName), { recursive: true });

  // Bare git repo
  const { stderr } = await exec(
    `git --git-dir ${getRepoPath(appName)} --bare init`,
  );
  if (stderr) throw stderr;

  // Create hook
  const hook = createHook(appName, options);
  writeFileSync(`${getRepoPath(appName)}/hooks/post-receive`, hook);
  chmodSync(`${getRepoPath(appName)}/hooks/post-receive`, '0777');

  // Clone empty working copy
  await exec(`git clone ${getRepoPath(appName)} \"${getWorkPath(appName)}\"`);
  return true;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const hookTemplate = readFileSync(
  join(__dirname, '..', 'hooks', 'post-receive'),
  'utf-8',
);

export function createHook(appName: string, options: AppOptionsType): string {
  options = AppOptions.parse(options);
  return hookTemplate
    .replace(/\{\{cirrus_dir\}\}/g, defaultOptions.root)
    .replace(/\{\{app\}\}/g, appName);
}
