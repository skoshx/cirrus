import { env } from 'process';
import { homedir, userInfo } from 'os';
import { writeFileSync, readFileSync, mkdirSync, chmodSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import pm2, { Proc, ProcessDescription, StartOptions } from 'pm2';
import publicIp from 'public-ip';
import { AppOptions, AppOptionsType } from './types';
import { getGlobalOptions, getProcessApp, getRepository } from './process';
import {
  getConfig,
  getLogPath,
  getRepoPath,
  getWorkPath,
  saveConfig,
  tryCatch,
} from './util';
import { log, LogLevels } from './logger';
import { createHook } from './hooks';
import { execa } from 'execa';

function startAppPm2(
  repositoryName: string,
  app: AppOptionsType,
): Promise<Proc> {
  return new Promise((resolve, reject) => {
    const processOptions: StartOptions = {
      name: app.appName,
      // script: 'npm',
      // script: `${join(getWorkPath(repositoryName), app.script ?? 'build/index.js')}`,
      script: app.script,
      // args: 'start',
      min_uptime: getGlobalOptions().minUptime,
      max_restarts: getGlobalOptions().maxRestarts,
      output: app.logFile,
      error: app.errorFile,
      cwd: join(getWorkPath(repositoryName), app.path ?? './'),
      env: {
        ...getGlobalOptions().env,
        ...app.env,
      },
    };

    pm2.start(processOptions, (err: Error, proc: Proc) => {
      if (err) reject(err);
      resolve(proc);
    });
  });
}

function stopAppPm2(app: string) {
  return new Promise((resolve, reject) => {
    pm2.stop(app, async (err: Error, proc: Proc) => {
      if (err) reject(err);
      resolve(proc);
    });
  });
}

function removeAppPm2(app: AppOptionsType) {
  return new Promise((resolve, reject) => {
    pm2.delete(app.appName, async (err: Error, proc: Proc) => {
      if (err) reject(err);
      resolve(proc);
    });
  });
}

// export async func

// TODO: Refactor -> startApp -> startRepository
// startApp should be for individual apps…
export async function startApp(repositoryName: string) {
  const repository = getRepository(repositoryName);
  if (!repository)
    throw Error(`Repository with name ${repository} does not exist.`);
  const startAppPromises = repository.apps.map((app) =>
    startAppPm2(repositoryName, app),
  );
  return await Promise.all(startAppPromises);
}

export async function removeApp(repositoryName: string) {
  const repository = getRepository(repositoryName);
  if (!repository)
    throw Error(`Repository with name ${repositoryName} does not exist.`);

  // Remove app from globalOptions
  const config = getConfig();
  config.repos = config.repos.filter(
    (repo) => repo.repositoryName !== repositoryName,
  );
  saveConfig(config);

  // Remove folders
  rmSync(getWorkPath(repositoryName), { recursive: true, force: true });
  rmSync(getRepoPath(repositoryName), { recursive: true, force: true });
  rmSync(getLogPath(repositoryName), { recursive: true, force: true });

  // Delete processes
  const removeAppPromises = repository.apps.map((app) => removeAppPm2(app));
  const removeAppResults = await Promise.all(removeAppPromises);

  return removeAppResults;
}

export async function stopApp(appName: string) {
  return new Promise(async (resolve, reject) => {
    /* if (!getApp(appName))
      return log(`App with name ${appName} does not exist.`, LogLevels.WARNING); */

    const app = await getProcessApp(appName);
    if (!app) resolve(null);

    pm2.stop(appName, (err: Error, proc: Proc) => {
      if (err) reject(err);
      resolve(proc);
    });
  });
}

export async function stopRepository(repositoryName: string) {
  const repository = getRepository(repositoryName);
  if (!repository)
    throw Error(`Repository with name ${repository} does not exist.`);
  const stopAppPromises = repository.apps.map((app) => stopAppPm2(app.appName));
  return await Promise.all(stopAppPromises);
}

// Exports
export * from './hooks';
export * from './types';
export * from './process';
