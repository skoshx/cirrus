// Shebang with ES modules… https://stackoverflow.com/questions/48179714/how-can-an-es6-module-be-run-as-a-script-in-node

import { render } from 'ink';
import meow, { Result } from 'meow';
import { createApp, defaultOptions, getApp, getLogs, listApps, ready, removeApp, startApp, stopApp } from '.';
import { renderList, Table } from './ink/list';
import { renderLogs } from './ink/logs';
import { log, logError } from './logger';
import { join } from 'path';
import { getDefaultEnvironment, tryCatch } from './util';

// TODO: Use Yargs instead…

const cli = meow(`
  🌧  Usage
	  $ cirrus [command]

	Commands
    create <app>            Create a new app
    remote <app> <repo>     Create a app from a remote GitHub repo
    remove <app>            Delete an app
    start <app>             Start an app monitored by pm2
    stop <app>              Stop an app
    restart <app>           Restart an app that's already running
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
    $ cirrus create my-remote-app https://github.com/skoshx/cirrus
`, {
	importMeta: import.meta,
	flags: {
		rainbow: {
			type: 'boolean',
			alias: 'r'
		}
	}
});

if (cli.input.length === 0) {
  cli.showHelp();
}

async function handleCliOptions(cli: Result<any>) {
  // Wait for Cirrus to warm up…
  await ready();

  if (cli.input[0] === 'create') {
    const { data, error } = await tryCatch(createApp(cli.input[1], {
      port: 8080,
      env: getDefaultEnvironment(),
      appName: cli.input[1],
      logFile: join(process.cwd(), 'log.txt'),
      errorFile: join(process.cwd(), 'error.txt')
    }));

    // TODO:
    // logFile: `$HOME/.pm2/logs/XXX-err.log`
    // logFile: `${os.homedir()/.pm2/logs/${cli.input[1]}-err.log}`

    if (error) return logError(error);

    // TODO: Rendering here…

    /* log(`Your app has been created.`);
    console.log("App options:"); 
    console.log(data); */

    if (await listApps()) renderList(await listApps());

    // process.exit(0);

    /* const x = await createApp(cli.input[1], { port: 8080, env: getDefaultEnvironment(), appName: cli.input[1] });
    if (!x) */
    /* console.log("X: ");
    console.log(x); */
  }

  if (cli.input[0] === 'remove') {
    const { data, error } = await tryCatch(removeApp(cli.input[1]));
    if (error) return logError(error);
    console.log("DATA: ");
    console.log(data);

    if (await listApps()) renderList(await listApps());
  }

  if (cli.input[0] === 'start') {
    const { data, error } = await tryCatch(startApp(cli.input[1], { port: 8080, env: getDefaultEnvironment(), appName: cli.input[1], logFile: `${process.cwd()}/log.txt`, errorFile: `${process.cwd()}/erorr.txt` }));

    console.log("DATA:");
    console.log(data);

    if (error) return logError(error);

    if (await listApps()) renderList(await listApps());
  }

  if (cli.input[0] === 'stop') {
    const { error } = await tryCatch(stopApp(cli.input[1]));

    if (error) return logError(error);

    if (await listApps()) renderList(await listApps());
  }

  if (cli.input[0] === 'list') {
    const { data, error } = await tryCatch(listApps());

    if (error) return logError(error);

    if (data) renderList(data);
  }

  if (cli.input[0] === 'logs') {
    const app = getApp(cli.input[1]);
    const { data, error } = await tryCatch(getLogs(app));

    if (error) return logError(error);

    if (data) renderLogs(data, app);
  }
}

handleCliOptions(cli);
