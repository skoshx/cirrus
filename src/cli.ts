import meow from 'meow';
import type { AnyFlags, Result } from 'meow';
import { renderInfo } from './ink/info';
import { renderList } from './ink/list';
import { renderLogs } from './ink/logs';
import { initProject } from './init';
import { deploy } from './deploy';
import { getDeployments, getLogs, getProjectInfo } from './project';
import { executeCommandOrCatch } from './util';

const init = {
	description: 'Create a new app',
	helpText: `
	🌧  Create - allows you to create a cloud app either from a local repository or a GitHub remote.
	$ cirrus create [options]
	
	Options
		--environment, -e       Path to an .env file to source when creating app
		--remote, -r            Create an app from a GitHub remote
	`,
	flags: {
		environment: { type: 'string', alias: 'e' },
		remote: { type: 'string', alias: 'r' }
	},
	handler: async (cli: Result<AnyFlags>) => {
		const projectName = cli.input[1];
		await initProject(projectName);
		renderList();
	}
};

const install = {
	description: 'Installs needed dependencies',
	helpText: `
	🌧  Install - installs all need dependencies (pm2, caddy, postgres)
	$ cirrus install`,
	handler: async (cli: Result<AnyFlags>) => {
		executeCommandOrCatch('npm install -g pm2');
		executeCommandOrCatch(
			'sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https'
		);
		executeCommandOrCatch(
			`curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg`
		);
		executeCommandOrCatch(
			`curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list`
		);
		executeCommandOrCatch(`sudo apt update`);
		executeCommandOrCatch(`sudo apt install caddy`);
		console.log(`🌧  All ready to fly above the cirrus clouds!`);
	}
};

const deployCli = {
	description: 'Deploy your app',
	helpText: `
	🌧  Deploy - deployes your app according to your Cirrus config.
	$ cirrus deploy [options]
	
	Options
		--environment, -e       Path to an .env file to source when creating app
		--remote, -r            Create an app from a GitHub remote
	`,
	flags: {
		environment: { type: 'string', alias: 'e' },
		remote: { type: 'string', alias: 'r' }
	},
	handler: async (cli: Result<AnyFlags>) => {
		const projectName = cli.input[1];
		const result = await deploy(projectName);
		renderList();
	}
};

const list = {
	description: 'List all your apps',
	helpText: `
	🌧 List - lists all Cirrus apps.
	$ cirrus list`,
	handler: async (cli: Result<AnyFlags>) => {
		renderList();
	}
};

const logs = {
	description: 'Show logs of an app',
	helpText: `
	🌧  Logs - show logs of an app
	$ cirrus logs <app>`,
	handler: async (cli: Result<AnyFlags>) => {
		const projectName = cli.input[1];
		const logs = await getLogs(projectName);
		renderLogs(logs, projectName);
	}
};

const info = {
	description: 'Show usable information about a Cirrus app',
	helpText: `
	🌧  Info - show usable information about a Cirrus app
	$ cirrus info <app>`,
	handler: async (cli: Result<AnyFlags>) => {
		const projectName = cli.input[1];
		const projectInfo = await getProjectInfo(projectName);
		renderInfo(projectInfo);
	}
};

const cli = meow(
	`
	🌧  Usage
	$ cirrus [command]
	
	Commands
		init <app>              Create a new app
		delete <app>            Delete an app
		info <app>              Shows detailed information about an app
		install                 Installs Cirrus' dependencies
		list                    List apps and status

	Options
		--loglevel              Log level ('emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug')
	
	Examples
		$ cirrus init my-app
		$ cirrus init --help`,
	{
		description: 'Cirrus is a push to deploy tool written above the cirrus clouds.',
		importMeta: import.meta,
		flags: {
			loglevel: { type: 'string', alias: 'l' }
		},
		// @ts-ignore
		commands: {
			init,
			deploy: deployCli,
			list,
			logs,
			info,
			install
		}
	}
);

// Set logging
if (cli.flags.loglevel) process.env.LOG_LEVEL = cli.flags.loglevel;

// @ts-ignore
cli.command.options.handler?.(cli);
