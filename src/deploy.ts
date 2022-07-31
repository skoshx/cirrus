import { join } from 'path';
import pm2, { Proc, StartOptions } from 'pm2';
import { getRootCirrusPath } from './defaults';
import { getCirrusEnvironment, getProjectEnvironment } from './env';
import { getCirrusLogger } from './logger';
import { runPlugins } from './plugins/plugin';
import { getProjectConfig } from './project';
import { Deployment, Project } from './types';
import {
	executeCommandOrCatch,
	getErrorLogFilePath,
	getLogFilePath,
	getWorkingDir,
	tryCatch,
	tryCatchSync
} from './util';

function getScriptAndArgs(startScript: string) {
	const [script, ...args] = startScript.split(' ');
	return { script, args: args.join(' ') };
}

function startAppPm2New(projectName: string, deployment: Deployment): Promise<Proc> {
	return new Promise((resolve, reject) => {
		const processOptions: StartOptions = {
			name: deployment.name,
			...getScriptAndArgs(deployment.start ?? 'npm run start'),
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
		// TODO support for pnpm, yarn
		executeCommandOrCatch('npm install', {
			cwd: join(getWorkingDir(projectName), config.deployments[i].path)
		});
		// run build command
		executeCommandOrCatch(config.deployments[i].build, {
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
