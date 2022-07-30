import { execaCommandSync } from 'execa';
import { join } from 'path';
import pm2, { Proc, StartOptions } from 'pm2';
import { getRootCirrusPath } from './defaults';
import { getCirrusEnvironment, getProjectEnvironment } from './env';
import { runPlugins } from './plugins/plugin';
import { getProjectConfig } from './project';
import { Deployment, Project } from './types';
import { getErrorLogFilePath, getLogFilePath, getWorkingDir } from './util';

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
	// go to repo
	// process.chdir(join(getRootCirrusPath(), projectName));
	// read project config file
	config = config ?? getProjectConfig(projectName);
	// run thru deployments
	const processes: Proc[] = [];
	for (let i = 0; i < config.deployments.length; i++) {
		// change dir
		// process.chdir(join(getRootCirrusPath(), projectName, config.deployments[i].path));
		// run install
		// TODO support for pnpm, yarn
		execaCommandSync('pnpm install', {
			cwd: join(getWorkingDir(projectName), config.deployments[i].path)
		});
		// run build command
		execaCommandSync(config.deployments[i].build, {
			cwd: join(getWorkingDir(projectName), config.deployments[i].path)
		});
		// run start command with PM2
		const proc = await startAppPm2New(projectName, config.deployments[i]);
		processes.push(proc);
	}
	// TODO check that all processes started healthy
	console.log('TODO check that all processes started healthy');

	// run through plugins
	await runPlugins({ event: 'deploy', project: config });

	return processes;
}
