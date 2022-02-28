import meow, { Result } from 'meow';
import {
  createApp,
  getApp,
  getLogPath,
  getLogs,
  getRepoPath,
  listApps,
  ready,
  removeApp,
  startApp,
  stopApp,
} from '.';
import pm2 from 'pm2';
import { renderList } from './ink/list';
import { renderLogs } from './ink/logs';
import { logError } from './logger';
import { join } from 'path';
import { getDefaultEnvironment, tryCatch } from './util';
import { renderInfo } from './ink/info';
import publicIp from 'public-ip';
import { userInfo } from 'os';
import { AppInfo } from '../dist';

// TODO: Use Yargs instead…

const cli = meow(
  `
  🌧  Usage
	$ cirrus [command]

	Commands
    create <app>            Create a new app
    remote <app> <repo>     Create a app from a remote GitHub repo
    remove <app>            Delete an app
    start <app>             Start an app monitored by pm2
    stop <app>              Stop an app
    restart <app>           Restart an app that's already running
    info <app>              Shows detailed information about an app
    list                    List apps and status
    startall                Start all apps not already running
    stopall                 Stop all apps
    restartall              Restart all running apps
    prune                   Clean up dead files
    hooks                   Update hooks after a pod upgrade
    web [command]           Start/stop/restart the web interface
    help                    You are reading it right now

	Examples
    $ cirrus create my-app
    $ cirrus create my-remote-app https://github.com/skoshx/cirrus`,
  {
    importMeta: import.meta,
    flags: {
      rainbow: {
        type: 'boolean',
        alias: 'r',
      },
    },
  },
);

if (cli.input.length === 0) cli.showHelp();

async function handleCliOptions(cli: Result<any>) {
  // Wait for Cirrus to warm up…
  await ready();

  if (cli.input[0] === 'create') {
    const { error } = await tryCatch(
      createApp(cli.input[1], {
        port: 8080,
        env: getDefaultEnvironment(),
        appName: cli.input[1],
        logFile: join(getLogPath(cli.input[1]), `${cli.input[1]}.log`),
        errorFile: join(getLogPath(cli.input[1]), `${cli.input[1]}-err.log`),
      }),
    );

    if (error) return logError(error);

    if (await listApps()) renderList(await listApps());
  }

  if (cli.input[0] === 'remove') {
    const { error } = await tryCatch(removeApp(cli.input[1]));
    if (error) return logError(error);
    if (await listApps()) renderList(await listApps());
  }

  if (cli.input[0] === 'start') {
    // TODO: here add support for providing same flags as create,
    // but update app instead, then start.
    const { error } = await tryCatch(startApp(cli.input[1]));

    if (error) return logError(error);

    if (await listApps()) renderList(await listApps());
  }

  if (cli.input[0] === 'stop') {
    const { error } = await tryCatch(stopApp(cli.input[1]));

    if (error) return logError(error);

    if (await listApps()) renderList(await listApps());
  }

  if (cli.input[0] === 'restart') {
    const { error } = await tryCatch(stopApp(cli.input[1]));
    if (error) return logError(error);

    const { error: startError } = await tryCatch(
      startApp(cli.input[1], getApp(cli.input[1])),
    );
    if (startError) return logError(startError);

    if (await listApps()) renderList(await listApps());
  }

  if (cli.input[0] === 'list') {
    const { data, error } = await tryCatch(listApps());

    if (error) return logError(error);

    if (data) renderList(data);
  }

  if (cli.input[0] === 'info') {
    const { data, error } = await tryCatch(listApps());

    if (error) return logError(error);

    const appInfo = data?.filter(
      (app: AppInfo) => app.appName === cli.input[1],
    )?.[0];

    if (!appInfo)
      return logError(
        new Error(`Could not find app with name ${cli.input[1]}`),
      );

    /* const app = getApp(cli.input[1]);

    const externalIp = await publicIp.v4();

    const env = Object.entries(app.env ?? {}).map(([key, value]) => `${key}=${value}`).join('\n'); */
    renderInfo(appInfo);

    // @ts-ignore
    // renderInfo({ ...app, env, remote: app.remote ? app.remote : `ssh://${userInfo().username}@${externalIp}${getRepoPath(app.appName)}`, });
  }

  if (cli.input[0] === 'logs') {
    // const app = getApp(cli.input[1]);
    const { data, error } = await tryCatch(getLogs(cli.input[1]));

    if (error) return logError(error);

    if (data) renderLogs(data, cli.input[1]);
  }

  // Drop daemon
  pm2.disconnect();
}

handleCliOptions(cli);
