import { join } from 'path';
import pm2, { Proc, StartOptions } from 'pm2';
import { getRootCirrusPath } from './defaults';
import { getCirrusEnvironment, getProjectEnvironment } from './env';
import { getCirrusLogger } from './logger';
import { PluginInterface, runPlugins } from './plugins/plugin';
import { getDeployments, getProjectConfig, getProjects } from './project';
import { Deployment, DeploymentInfo, Project, ProjectInfo } from './types';
import {
	executeCommandOrCatch,
	getBuildCommand,
	getErrorLogFilePath,
	getInstallCommand,
	getLogFilePath,
	getProjectPackageManager,
	getStartCommand,
	getWorkingDir,
	tryCatch,
	tryCatchSync
} from './util';

export interface DeploymentInterface {
	/* installDependencies(projectName: string, deployment: Deployment): Promise<boolean>; // fix this, this has to be streamed somehwo
	build(projectName: string, deployment: Deployment): Promise<any>; */
	startApp(projectName: string, deployment: Deployment): Promise<DeploymentInfo>;
	runPlugins(projectName: string, plugins: PluginInterface[]): Promise<any>;
	runCommand(command: string, projectName: string, deployment: Deployment): Promise<any>;
}

/* export const cirrusDeployer: DeploymentInterface = {
	async startApp(projectName, deployment) {
		// Install
		this.runCommand(getInstallCommand(projectName), projectName, deployment);

		// Build
		this.runCommand(getBuildCommand(projectName), projectName, deployment);
		
		// Start
		await startAppPm2New(projectName, deployment);
		return (await getDeployments()).find((createdDeployment) => createdDeployment.name === deployment.name);
	},
	async runPlugins(projectName, plugins) {
		plugins.forEach((plugin) => {
			plugin.run({ event: 'deploy', project: getProjectConfig(projectName) });
		});
	},
	async runCommand(command: string, projectName: string, deployment: Deployment) {
		executeCommandOrCatch(command, {
			cwd: join(getWorkingDir(projectName), deployment.path)
		});
	}
} */

/* export function runDeployment(projectName: string, deployer: DeploymentInterface) {
	/* const project = getProjects().find((project) => project.deployments.find((deployment) => deployment.name === deploymentName));
	if (!project) throw new Error(`Could not find a deployment with name ${deploymentName}. Type 'cirrus list' to list all deployments.`);
	const config = getProjectConfig(projectName);

	for (let i = 0; i < config.deployments.length; i++) {
		const deployment = config.deployments[i];

		// Install dependencies
		deployer.installDependencies(projectName, deployment);

		// Build
		deployer.build(projectName, deployment);

		// Start app
		deployer.startApp(projectName, deployment);

		// Run plugins
		deployer.runPlugins(projectName, [caddyPlugin]);
	}
} */

function getScriptAndArgs(startScript: string) {
	const [script, ...args] = startScript.split(' ');
	return { script, args: args.join(' ') };
}

function startAppPm2New(projectName: string, deployment: Deployment): Promise<Proc> {
	return new Promise((resolve, reject) => {
		const processOptions: StartOptions = {
			name: deployment.name,
			...getScriptAndArgs(deployment.start ?? getStartCommand(projectName)),
			min_uptime: 3_600_000,
			max_restarts: 10,
			output: getLogFilePath(deployment),
			error: getErrorLogFilePath(deployment),
			cwd: join(getRootCirrusPath(), projectName, deployment.path),
			env: {
				NODE_ENV: 'production',
				...getCirrusEnvironment(),
				...getProjectEnvironment(projectName),
				PORT: String(deployment.port)
			}
		};

		pm2.start(processOptions, (err: Error, proc: Proc) => {
			if (err) reject(err);
			resolve(proc);
		});
	});
}

// then `cirrus deploy <project name>` gets called
export async function deploy(projectName: string, config?: Project) {
	// read project config file
	config = config ?? getProjectConfig(projectName);
	getCirrusLogger().info(
		`deploying ${config.deployments.length} deployments from project ${projectName}`,
		{ config }
	);
	// run thru deployments
	const processes: Proc[] = [];
	for (let i = 0; i < config.deployments.length; i++) {
		getCirrusLogger().info(`deploying ${config.deployments[i].name}`);
		// run install
		executeCommandOrCatch(getInstallCommand(projectName), {
			cwd: join(getWorkingDir(projectName), config.deployments[i].path)
		});
		// run build command
		executeCommandOrCatch(config.deployments[i].build ?? getBuildCommand(projectName), {
			cwd: join(getWorkingDir(projectName), config.deployments[i].path)
		});
		// run start command with PM2
		const { data: proc, error } = await tryCatch(
			startAppPm2New(projectName, config.deployments[i])
		);
		if (error)
			getCirrusLogger().error(
				`an error occurred while trying to start deployment ${config.deployments[i].name} with PM2.`,
				{ error }
			);
		processes.push(proc as Proc);
	}
	// TODO check that all processes started healthy
	console.log('TODO check that all processes started healthy');

	// run through plugins
	await runPlugins({ event: 'deploy', project: config });

	return processes;
}
