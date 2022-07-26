import meow, { type AnyFlags, type Result } from 'meow';
import { deploy, getDeployments, getProjectInfo, initProject } from './init';
import { renderInfo } from './ink/info';
import { renderList } from './ink/list';

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
		remote: { type: 'string', alias: 'r' },
	},
	handler: async (cli: Result<AnyFlags>) => {
		const projectName = cli.input[1];
		const result = await initProject(projectName);
		console.log("init project resutl : ");
		console.log(result);
	}
}

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
		remote: { type: 'string', alias: 'r' },
	},
	handler: async (cli: Result<AnyFlags>) => {
		const projectName = cli.input[1];
		const result = await deploy(projectName);
		console.log("Result ");
		console.log(result);
		// renderList(await listApps());
	}
}

const list = {
	description: 'List all your apps',
	helpText: `
	🌧 List - lists all Cirrus apps.
	$ cirrus list`,
	handler: async (cli: Result<AnyFlags>) => {
		const deployments = await getDeployments();
		renderList(deployments);
	}
}

const logs = {
	description: 'Show logs of an app',
	helpText: `
	🌧  Logs - show logs of an app
	$ cirrus logs <app>`,
	handler: async (cli: Result<AnyFlags>) => {

	}
}

const info = {
	description: 'Show usable information about a Cirrus app',
	helpText: `
	🌧  Info - show usable information about a Cirrus app
	$ cirrus info <app>`,
	handler: async (cli: Result<AnyFlags>) => {
		// get info
		const projectName = cli.input[1];
		const projectInfo = await getProjectInfo(projectName);
		renderInfo(projectInfo);
	}
}


const cli = meow(
	`
	🌧  Usage
	$ cirrus [command]
	
	Commands
	create <app>            Create a new app
	remove <app>            Delete an app
	start <app>             Start an app monitored by pm2
	stop <app>              Stop an app
	restart <app>           Restart an app that's already running
	info <app>              Shows detailed information about an app
	update <app>            Update app after modifying it from .cirrusrc
	setup                   Sets up Cirrus (env, plugins, firewalls)
	list                    List apps and status
	prune                   Clean up dead files
	web [command]           Start/stop/restart the web interface
	help                    You are reading it right now
	
	Examples
	$ cirrus create my-app
	$ cirrus create --help`,
	{
		description: 'Cirrus is a push to deploy tool written above the cirrus clouds.',
		importMeta: import.meta,
		// @ts-ignore
		commands: {
			init,
			deploy: deployCli,
			list,
			logs,
			info
		},
	},
);

// @ts-ignore
cli.command.options.handler?.(cli);

// console.log("CLI");
// console.log(cli);
