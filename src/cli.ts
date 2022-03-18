import meow, { AnyFlags, Options, Result } from 'meow';
import pm2 from 'pm2';
import { renderList } from './ink/list';
import { renderLogs } from './ink/logs';
import { logError } from './logger';
import { join } from 'path';
import { userInfo } from 'os';
import { renderInfo } from './ink/info';
import { removeApp, startApp, stopApp, stopRepository } from '.';
import { getAvailablePort, getLogPath, getRepoPath, tryCatch } from './util';
import { defaultOptions, getDefaultGlobalEnvironment } from './defaults';
import {
  getApp,
  getLogs,
  listApps,
  initCirrus,
  AppInfo,
  getRepositoryInfo,
  getRepository,
} from './process';
import { createApp, updateHook } from './create';
import publicIp from 'public-ip';
import { createHook } from './hooks';

const subcommand = (options: Options<AnyFlags>) =>
  meow({
    ...options,
    description: 'Subcommand description',
    help: `
		Unicorn command
		Usage:
			foo unicorn <input>
	`,
    flags: {
      unicorn: { alias: 'u', isRequired: true },
    },
  });

/*const subcommand = (options: Options<AnyFlags>) => meow({
	...options,
	description: 'Subcommand description',
	help: `
		Unicorn command
		Usage:
			foo unicorn <input>
	`,
	flags: {
		unicorn: {alias: 'u', isRequired: true},
	},
});*/

const create = (options: Options<AnyFlags>) =>
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

const remove = (options: Options<AnyFlags>) =>
  meow({
    ...options,
    help: `
  🌧  Remove - remove a Cirrus app
	$ cirrus remove <app>
  `,
  });

const stop = (options: Options<AnyFlags>) =>
  meow({
    ...options,
    help: `
  🌧  Stop - stop a Cirrus app
	$ cirrus stop <app>

  Options
    --repository, -r        Stop all apps in the repository
  `,
  });

const info = (options: Options<AnyFlags>) =>
  meow({
    ...options,
    help: `
  🌧  Info - show usable information about a Cirrus app
	$ cirrus info <app>
  `,
  });

const start = (options: Options<AnyFlags>) =>
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

const restart = (options: Options<AnyFlags>) => {
  meow({
    ...options,
    help: `
  🌧  Restart - Restart a Cirrus app
	$ cirrus restart <app>
  `,
  });
};

const list = (options: Options<AnyFlags>) =>
  meow({
    ...options,
    help: `
  🌧  List - list all Cirrus apps
	$ cirrus list <app>
  `,
  });

const web = (options: Options<AnyFlags>) =>
  meow({
    ...options,
    help: `
  🌧  Web - a web interface to monitor your apps
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

const logs = (options: Options<AnyFlags>) =>
  meow({
    ...options,
    help: `
  🌧  Logs - show logs of an app
  $ cirrus logs <app>

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

const update = (options: Options<AnyFlags>) =>
  meow({
    ...options,
    help: `
  🌧  Update - update everything after modifying .cirrusrc
  $ cirrus update <app>

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
      // @ts-ignore
      remove,
      // @ts-ignore
      stop,
      // @ts-ignore
      start,
      // @ts-ignore
      restart,
      // @ts-ignore
      list,
      // @ts-ignore
      info,
      // @ts-ignore
      web,
      // @ts-ignore
      logs,
      // @ts-ignore
      update,
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
    const { error } = await tryCatch(
      createApp(cli.input[0], [
        {
          port,
          env: {
            ...getDefaultGlobalEnvironment(),
            PORT: port.toString(),
          },
          script: (cli.flags.script as string) ?? 'build/index.js', // SvelteKit default ;)
          appName: cli.input[0],
        },
      ]),
    );

    if (error) return logError(error);

    renderList(await listApps());
  },
  remove: async (cli: Result<any>) => {
    const { error } = await tryCatch(removeApp(cli.input[0]));
    if (error) return logError(error);
    if (await listApps()) renderList(await listApps());
  },
  stop: async (cli: Result<any>) => {
    const { error } = await tryCatch(
      cli.flags.repository
        ? stopRepository(cli.flags.repository as string)
        : stopApp(cli.input[0]),
    );
    if (error) return logError(error);
    if (await listApps()) renderList(await listApps());
  },
  start: async (cli: Result<any>) => {
    const { error } = await tryCatch(startApp(cli.input[0]));
    if (error) return logError(error);
    renderList(await listApps());
  },
  restart: async (cli: Result<any>) => {
    const { error } = await tryCatch(stopApp(cli.input[0]));
    if (error) return logError(error);
    const { error: startError } = await tryCatch(startApp(cli.input[0]));
    if (startError) return logError(startError);
    if (await listApps()) renderList(await listApps());
  },
  list: async (cli: Result<any>) => {
    const { data, error } = await tryCatch(listApps());
    if (error) return logError(error);
    if (data) renderList(data);
  },
  info: async (cli: Result<any>) => {
    const repository = getRepository(cli.input[0]);
    if (!repository)
      return logError(
        new Error(`Repository named ${cli.input[0]} does not exist.`),
      );

    const repoInfo = await getRepositoryInfo(repository.repositoryName);
    renderInfo(repoInfo);
  },
  logs: async (cli: Result<any>) => {
    const { data, error } = await tryCatch(getLogs(cli.input[0]));
    if (error) return logError(error);
    if (data) renderLogs(data, cli.input[0]);
  },
  update: async (cli: Result<any>) => {
    const repository = getRepository(cli.input[0]);
    if (!repository)
      return logError(
        new Error(`Repository named ${cli.input[0]} does not exist.`),
      );
    const hook = createHook(repository.repositoryName, repository.apps);
    updateHook(repository.repositoryName, hook);
  },
};

async function handleCli(cli: Result<any>) {
  await initCirrus(defaultOptions);

  // @ts-ignore
  // console.log(cli.commands);

  // @ts-ignore
  const [command, commandOptions] = Object.entries(cli.commands ?? {})?.[0];
  const subcommand = subcommands[command];
  // @ts-ignore
  if (subcommand) await subcommand(commandOptions);

  pm2.disconnect();
}

handleCli(cli);
