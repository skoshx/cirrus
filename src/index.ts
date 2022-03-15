import { env } from 'process';
import { homedir, userInfo } from 'os';
import { writeFileSync, readFileSync, mkdirSync, chmodSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import pm2, { Proc, ProcessDescription, StartOptions } from 'pm2';
import publicIp from 'public-ip';
import { AppOptions, AppOptionsType } from './types';
import { getApp, getProcessApp } from './process';
import { getConfig, getLogPath, getRepoPath, getWorkPath, saveConfig, tryCatch } from './util';
import { log, LogLevels } from './logger';
import { createHook } from './hooks';
import { execa } from 'execa';

/*export async function startApp(appName: string, apps?: AppOptionsType[]) {
  return new Promise((resolve, reject) => {
    const app = getApp(appName);
    if (!app) reject(`App with name ${appName} does not exist.`);

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
}*/

export async function removeApp(appName: string) {
  return new Promise(async (resolve, reject) => {
    if (!getApp(appName))
      throw Error(`App with name ${appName} does not exist.`);
    pm2.delete(appName, async (err: Error, proc: Proc) => {
      if (err) reject(err);
      // Remove app from globalOptions
      const config = getConfig();
      delete config.apps[appName];
      saveConfig(config);

      // Remove folders
      rmSync(getWorkPath(appName), { recursive: true, force: true });
      rmSync(getRepoPath(appName), { recursive: true, force: true });
      rmSync(getLogPath(appName), { recursive: true, force: true });

      resolve(proc);
    });
  });
}

export async function stopApp(appName: string) {
  return new Promise(async (resolve, reject) => {
    if (!await getApp(appName))
      return log(`App with name ${appName} does not exist.`, LogLevels.WARNING);
    
    const app = await getProcessApp(appName);
    if (!app) resolve(null);

    pm2.stop(appName, (err: Error, proc: Proc) => {
      if (err) reject(err);
      resolve(proc);
    });
  });
}

// Exports
export * from './hooks';
export * from './types';
export * from './process';
