import { AppOptionsType, PushOptionsType } from "./types";
import pm2, { ProcessDescription } from 'pm2';
import { getConfig, getRepoPath, tryCatch } from "./util";
import publicIp from "public-ip";
import { userInfo, homedir } from 'os';
import { readFileSync } from 'fs';
import { defaultOptions } from "./defaults";

let globalOptions: PushOptionsType;

export async function initCirrus(): Promise<PushOptionsType> {
  await connectToPm2(); // Daemonize PM2
  return globalOptions;
}

export const getGlobalOptions = (configPath?: string): PushOptionsType => {
  if (globalOptions) return globalOptions;
  configPath = configPath ?? defaultOptions.root;
  globalOptions = {
    ...defaultOptions,
    ...getConfig(configPath),
  };
  return globalOptions;
};

async function connectToPm2() {
  return new Promise((resolve) => {
    pm2.connect(resolve);
  });
}

export const getApp = (appName: string): AppOptionsType[] => getGlobalOptions().apps[appName] ?? null;

export const getProcessApp = async (appName: string) => (await listPm2Apps()).filter((app: PartialAppInfo) => app.appName === appName)?.[0];

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
  return [];
  /*return globalOptions.apps.map((app: AppOptionsType) => {
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
  });*/
}

export async function getLogs(appName: string): Promise<AppLogs> {
  const app = getApp(appName);
  if (!app) throw Error(`Could not find app with name ${appName}`);
  /* const { data: error } = await tryCatch(() =>
    readFileSync(app.errorFile)?.toString('utf-8')?.split('\n'),
  );
  const { data: log } = await tryCatch(() =>
    readFileSync(app.logFile)?.toString('utf-8')?.split('\n'),
  ); */
  return { appName, error: [], log: [] };
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
