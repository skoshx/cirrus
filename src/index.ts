// Pod2 - Improved Pod

// What we need: 

// Environments for every app…
// Optional?? setup postgres
// Caddy server

// Firewalls

import { env } from 'process';
import { homedir } from 'os';
import { writeFileSync, readFileSync, mkdirSync, chmodSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec as execSync } from 'child_process';
import { promisify } from 'util';
const exec = promisify(execSync);
import pm2, { Proc, ProcessDescription, StartOptions } from 'pm2';
// Pm2 async functions
const deleteProcess = promisify(pm2.delete);
const stop = promisify(pm2.stop);
const start = promisify<StartOptions, Proc>(pm2.start);
// const describe = promisify(pm2.describe);
const list = promisify(pm2.list);

import { getDefaultEnvironment, tryCatch } from './util';
import { log, logError, LogLevels } from './logger';

async function connectToPm2() {
  return new Promise((resolve) => {
    pm2.connect(resolve);
  });
}

/* pm2.connect(() => {
  // pm2Client = pm2.
  log('PM2 Daemonized');
}); */

export interface AppOptions {
  appName: string;
  port: number;
  errorFile: string;
  logFile: string;
  env?: { [key: string]: string };
  instances?: number;
  remote?: `https://github.com/${string}/${string}.git`;
};

export interface PushOptions {
  /**
   * The root where all Cirrus related files will be stored.
   */
  root: string;
  /**
   * Default environment variables that will be included for all
   * apps. These can be overwritten by providing `env` in `AppOptions`
   */
  env: { [key: string]: string };
  minUptime: number;
  maxRestarts: number;
  apps: AppOptions[];
};

export const defaultOptions: PushOptions = {
  root: process.env.CIRRUS_CONF ?? join(process.env.HOME ?? homedir(), 'cirrus'),
  env: getDefaultEnvironment(),
  minUptime: 3600000,
  maxRestarts: 10,
  apps: []
};

export let globalOptions: PushOptions;

export async function ready() {
  if (globalOptions) return globalOptions;
  globalOptions = {
    ...defaultOptions,
    ...(await getConfig(defaultOptions))
  };
  // Daemonize PM2 
  await connectToPm2();
}

export const getApp = (appName: string | undefined) => globalOptions.apps.filter((app: AppOptions) => app.appName === appName)?.[0];

// Do setup…
// TODO: Setup with different options, we can automatically setup postgres
// caddy server etc…
export async function install() {}

export async function createApp(appName: string, options: AppOptions): Promise<Error | AppOptions> {
  if (getApp(appName)) throw Error(`App with name ${appName} exists already.`);

  globalOptions.apps.push(options);
  saveConfig(globalOptions);

  const { error } = await tryCatch<boolean>(options.remote ? createRemoteApp(appName, options) : createAppRepo(appName, options));
  if (error) return error;

  // Return created app
  return getApp(appName);
}

export async function startApp(appName: string, options: AppOptions) {
  return new Promise((resolve, reject) => {
    const app = getApp(appName);
    if (!app) reject(`App with name ${appName} does not exist.`);

    const processOptions: StartOptions = {
      name: appName,
      // script: 'npm',
      script: `${join(getWorkPath(appName), 'build/index.js')}`,
      // args: 'start',
      min_uptime: globalOptions.minUptime,
      max_restarts: globalOptions.maxRestarts,
      output: options.logFile,
      error: options.errorFile,
      cwd: getWorkPath(appName),
      env: { ...globalOptions.env, ...options.env, PORT: options.port.toString() }
    };

    pm2.start(processOptions, (err: Error, proc: Proc) => {
      if (err) reject(err);
      resolve(proc);
    });
  });
}

export async function removeApp(appName: string) {
  return new Promise((resolve, reject) => {
    if (!getApp(appName)) throw Error(`App with name ${appName} does not exist.`);
    pm2.delete(appName, (err: Error, proc: Proc) => {
      if (err) reject(err);
      // Remove app from globalOptions
      globalOptions.apps = globalOptions.apps.filter((app: AppOptions) => app.appName !== appName);
      // Remove folders
      rmSync(getWorkPath(appName), { recursive: true, force: true });
      rmSync(getRepoPath(appName), { recursive: true, force: true });


      saveConfig(globalOptions);
      resolve(proc);
    });
  });
  /* if (!getApp(appName)) return log(`App with name ${appName} does not exist.`, LogLevels.WARNING);


  const result: Proc = await deleteProcess(appName);
  console.log("result");
  console.log(result); */
}

export async function stopApp(appName: string) {
  return new Promise((resolve, reject) => {
    if (!getApp(appName)) return log(`App with name ${appName} does not exist.`, LogLevels.WARNING);

    pm2.stop(appName, (err: Error, proc: Proc) => {
      if (err) reject(err);
      resolve(proc);
    });
  });

  /*Client.executeRemote('getMonitorData', {}, function (err, list) {
    if (err) return callback(err)
    var runningProcs = findInList(appname, list)
    if (!runningProcs) {
        return callback(null, appname.yellow + ' is not running.')
    } else {
        async.map(runningProcs, function (proc, done) {
            Client.executeRemote('stopProcessId', proc.pm_id, function (err) {
                if (err) return done(err)
                Client.executeRemote('deleteProcessId', proc.pm_id, done)
            })
        }, function (err) {
            if (err) return callback(err)
            var l = runningProcs.length
            return callback(
                null,
                appname.yellow + ' stopped.' +
                (l > 1 ? (' (' + l + ' instances)').grey : '')
            )
        })
    }
  })*/
}

// From PM2 types
export type ProcessStatus = 'online' | 'stopping' | 'stopped' | 'launching' | 'errored' | 'one-launch-status';

export interface AppInfo {
  appName: string;
  port: number;
  cpu?: number;
  memory?: number;
  uptime: number;
  status?: ProcessStatus;
}

export interface AppLogs {
  appName: string;
  error: string[];
  log: string[];
}

export async function listApps(): Promise<AppInfo[]> {
  const pm2Apps = await listPm2Apps();
  return globalOptions.apps.map((app: AppOptions) => {
    const pm2App = pm2Apps.filter((pm2App: AppInfo) => pm2App.appName === app.appName)?.[0];
    /* console.log("PM2 APP ");
    console.log(pm2App); */
    return {
      appName: app.appName,
      port: app.port,
      cpu: pm2App?.cpu,
      memory: pm2App?.memory,
      uptime: pm2App?.uptime ?? 0,
      status: pm2App?.status,
    }
  });
}

export async function getLogs(app: AppOptions): Promise<AppLogs> {
  const error = readFileSync(app.errorFile)?.toString('utf-8')?.split('\n');
  const log = readFileSync(app.logFile)?.toString('utf-8')?.split('\n');
  return { appName: app.appName, error, log };
}

export async function listPm2Apps(): Promise<AppInfo[]> {
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
  /* const result = await describe('all');
  console.log("RESULT : ");
  console.log(result); */
  /*const procs: ProcessDescription[] = await list();
  console.log("---- PROCS");
  console.log(procs); */
  /* return procs.filter((process: ProcessDescription) => getApp(process.name)).map((process: ProcessDescription) => {
    return {
      appName: process.name,
      port: getApp(process.name).port,
      cpu: process.monit?.cpu,
      memory: process.monit?.memory,
      uptime: process.pm2_env?.pm_uptime,
      status: process.pm2_env?.status
    };
  }); */
  /* for (let i = 0; i < procs.length; i++) {

  } */
 
  /* pm2.list((err, procList) => {
    console.log("ERROR :");
    console.log(err);
    console.log("PROCLIST");
    console.log(procList);
  }); */
  /* return globalOptions.apps.map(async (app: AppOptions) => {
    const processDescription: ProcessDescription[] = await describe(app.appName);
    return {
      appName: app.appName,
      port: app.port,
      cpu: processDescription[0].monit?.cpu,
      memory: processDescription[0].monit?.memory,
      uptime: processDescription[0].pm2_env?.pm_uptime,
      status: processDescription[0].pm2_env?.status
    };
    /*pm2.describe(app.appName, (err: Error, processDescriptionList: ProcessDescription[]) => {
      const cpu = processDescriptionList[0].monit?.cpu;
      const memory = processDescriptionList[0].monit?.memory;
      const uptime = processDescriptionList[0].pm2_env?.pm_uptime;
      const status = processDescriptionList[0].pm2_env?.status;
      console.log(processDescriptionList);
    });
    // pm2.list((err: Error,))
  });*/
}


export function saveConfig(config: PushOptions) {
  mkdirSync(config.root, { recursive: true });
  writeFileSync(join(config.root, '.cirrusrc'), JSON.stringify(config, null, 2));
}

export async function getConfig(config: PushOptions): Promise<PushOptions> {
  const { data } = await tryCatch(() => readFileSync(join(config.root, '.cirrusrc'), 'utf-8'));
  return data ? JSON.parse(data) : defaultOptions;
}

export const getWorkPath = (appName: string) => join(defaultOptions.root, 'apps', appName);
export const getRepoPath = (appName: string) => join(defaultOptions.root, 'repos', appName + '.git');

export async function createRemoteApp(appName: string, options: AppOptions): Promise<boolean> {
  const { stderr } = await exec(`git clone ${options.remote} \"${getWorkPath(appName)}\"`);
  if (stderr) throw stderr;
  return true;
  /*exec('git clone ' + options.remote + ' \"' + info.workPath+'\"', function (err) {
    done(err, [
        'created remote app at ' + info.workPath.yellow,
        'tracking remote: ' + remote.cyan
    ])*/
}

export async function createAppRepo(appName: string, options: AppOptions): Promise<boolean> {
  // Create directory
  mkdirSync(getRepoPath(appName), { recursive: true });

  // Bare git repo
  const { stderr } = await exec(`git --git-dir ${getRepoPath(appName)} --bare init`);
  if (stderr) throw stderr;

  // Create hook
  const hook = createHook(appName, options);
  writeFileSync(`${getRepoPath(appName)}/hooks/post-receive`, hook);
  chmodSync(`${getRepoPath(appName)}/hooks/post-receive`, '0777');

  // Clone empty working copy
  await exec(`git clone ${getRepoPath(appName)} \"${getWorkPath(appName)}\"`);
  /* console.log("Executed: ", `git clone ${getRepoPath(appName)} \"${getWorkPath(appName)}\"`);
  console.log("REject:");
  console.log(stderr2); */
  // if (stderr2) throw stderr2;
  return true;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const hookTemplate = readFileSync(join(__dirname, '..', 'hooks', 'post-receive'), 'utf-8');

export function createHook(appName: string, options: AppOptions): string {
  return hookTemplate.replace(/\{\{pod_dir\}\}/g, defaultOptions.root).replace(/\{\{app\}\}/g, appName);
}
