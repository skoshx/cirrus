import meow, { AnyFlags, Options, Result } from 'meow';
import pm2 from 'pm2';
import { renderList } from './ink/list';
import { renderLogs } from './ink/logs';
import { logError } from './logger';
import { join } from 'path';
import { renderInfo } from './ink/info';
import { removeApp, stopApp } from '.';
import { getAvailablePort, getLogPath, tryCatch } from './util';
import { getDefaultGlobalEnvironment } from './defaults';
import { getApp, getLogs, listApps, initCirrus, AppInfo } from './process';

const create = (helpText: string, options: Options<any>) =>
  meow({
    ...options,
    help: `
  🌧  Create - allows you to create a cloud app either from a local repository or a GitHub remote.
	$ cirrus create [options]

  Options
    --port, -p              Port to use for your app
    --environment, -e       Path to an .env file to source when creating app
    --remote, -r            Create an app from a GitHub remote
    --script, -s            Path to the start script. Defaults to 'build/index.js'
  `,
    flags: {
      port: { type: 'number', alias: 'p' },
      environment: { type: 'string', alias: 'e' },
      remote: { type: 'string', alias: 'r' },
      script: { type: 'string', alias: 's' },
    },
  });

const remove = (helpText: string, options: Options<any>) =>
  meow({
    ...options,
    help: `
  🌧  Remove - remove a Cirrus app
	$ cirrus remove <app>
  `,
  });

const stop = (helpText: string, options: Options<any>) =>
  meow({
    ...options,
    help: `
  🌧  Stop - stop a Cirrus app
	$ cirrus stop <app>
  `,
  });

const info = (helpText: string, options: Options<any>) =>
  meow({
    ...options,
    help: `
  🌧  Info - show usable information about a Cirrus app
	$ cirrus info <app>
  `,
  });

const start = (helpText: string, options: Options<any>) =>
  meow({
    ...options,
    help: `
  🌧  Start - start a Cirrus app with optional flags
	$ cirrus create [options]

  Options
    --port, -p              Port to use for your app
    --environment, -e       Path to an .env file to source when creating app
  `,
    flags: {
      port: { type: 'number', alias: 'p' },
      environment: { type: 'string', alias: 'e' },
    },
  });

const restart = (helpText: string, options: Options<any>) =>
  meow({
    ...options,
    help: `
  🌧  Restart - Restart a Cirrus app
	$ cirrus restart <app>
  `,
  });

const list = (helpText: string, options: Options<any>) =>
  meow({
    ...options,
    help: `
  🌧  Cirrus 'list' usage
	$ cirrus list <app>
  `,
  });

const web = (helpText: string, options: Options<any>) =>
  meow({
    ...options,
    help: `
  🌧  Cirrus 'web' usage
	$ cirrus web [options]

  Options
    --port, -p              Port for the web service
    --start,                Start web service
    --stop,                 Stop web service
  `,
    flags: {
      port: { type: 'number', alias: 'p' },
      start: { type: 'boolean' },
      stop: { type: 'boolean' },
    },
  });

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
    setup                   Sets up Cirrus (env, plugins, firewalls)
    list                    List apps and status
    prune                   Clean up dead files
    web [command]           Start/stop/restart the web interface
    help                    You are reading it right now

	Examples
    $ cirrus create my-app
    $ cirrus create my-remote-app --remote https://github.com/skoshx/cirrus`,
  {
    importMeta: import.meta,
    commands: {
      // @ts-ignore
      create,
      /* remove,
      stop,
      start,
      restart,
      list,
      web, */
    },
    flags: {
      rainbow: {
        type: 'boolean',
        alias: 'r',
      },
    },
  },
);

const subcommands: Record<string, any> = {
  create: async (cli: Result<any>) => {
    const port = getAvailablePort(cli.flags.port as undefined);
    /*const { error } = await tryCatch(
      createApp(cli.input[0], {
        port,
        env: {
          ...getDefaultGlobalEnvironment(),
          PORT: port.toString()
        },
        script: cli.flags.script as any ?? 'build/index.js', // SvelteKit default ;)
        appName: cli.input[0],
        logFile: join(getLogPath(cli.input[0]), `${cli.input[0]}.log`),
        errorFile: join(getLogPath(cli.input[0]), `${cli.input[0]}-err.log`),
      }),
    );

    if (error) return logError(error); */

    if (await listApps()) renderList(await listApps());
  },
  remove: async (cli: Result<any>) => {
    const { error } = await tryCatch(removeApp(cli.input[0]));
    if (error) return logError(error);
    if (await listApps()) renderList(await listApps());
  },
  stop: async (cli: Result<any>) => {
    const { error } = await tryCatch(stopApp(cli.input[0]));
    if (error) return logError(error);
    if (await listApps()) renderList(await listApps());
  },
  start: async (cli: Result<any>) => {
    // const { error } = await tryCatch(startApp(cli.input[0]));
    // if (error) return logError(error);
    if (await listApps()) renderList(await listApps());
  },
  restart: async (cli: Result<any>) => {
    const { error } = await tryCatch(stopApp(cli.input[0]));
    if (error) return logError(error);
    /*const { error: startError } = await tryCatch(
      startApp(cli.input[0], getApp(cli.input[0])),
    );
    if (startError) return logError(startError);*/
    if (await listApps()) renderList(await listApps());
  },
  list: async (cli: Result<any>) => {
    const { data, error } = await tryCatch(listApps());
    if (error) return logError(error);
    if (data) renderList(data);
  },
  info: async (cli: Result<any>) => {
    const { data, error } = await tryCatch(listApps());
    if (error) return logError(error);

    const appInfo = data?.filter(
      (app: AppInfo) => app.appName === cli.input[0],
    )?.[0];
    if (!appInfo)
      return logError(
        new Error(`Could not find app with name ${cli.input[0]}`),
      );
    renderInfo(appInfo);
  },
  logs: async (cli: Result<any>) => {
    const { data, error } = await tryCatch(getLogs(cli.input[0]));
    if (error) return logError(error);
    if (data) renderLogs(data, cli.input[0]);
  },
};

async function handleCli(cli: Result<any>) {
  // await initCirrus();

  const command = Object.keys(cli.commands ?? {})?.[0];
  const subcommand = subcommands[command];
  if (subcommand) await subcommand(cli);

  pm2.disconnect();
}

handleCli(cli);
