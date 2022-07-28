import { execaCommandSync } from 'execa';
import { ROOT_CIRRUS_PATH } from './defaults';
import { join } from 'path';
import { readFileSync, writeFileSync, chmodSync, readdirSync } from 'fs';
import { z } from 'zod';
import { tryCatchSync } from './util';
import pm2 from 'pm2';
import type { Proc, StartOptions, ProcessDescription } from 'pm2';
import publicIp from 'public-ip';
import { userInfo } from 'os';
import type { Pm2AppInfo } from './process';
import { corePlugins } from './plugins/plugin';

export const DeploymentSchema = z.object({
	path: z.string().default('.'),
	name: z.string(), // TODO check no spaces
	port: z.number(),
	// commands: z.array(z.string()), this or then
	build: z.string().default('npm run build'),
	start: z.string().default('npm run start'),
	domain: z.string().url().optional(),
	logFilePath: z.string().optional(),
	errorLogFilePath: z.string().optional()
});

export const ProjectSchema = z.object({
	name: z.string(), // TODO check no spaces
	deployments: z.array(DeploymentSchema),
	plugins: z.array(z.string()).optional()
});

export const getLogFilePath = (deployment: Deployment) =>
	join(ROOT_CIRRUS_PATH, 'logs', deployment.name, deployment.logFilePath ?? `stdout.log`);
export const getErrorLogFilePath = (deployment: Deployment) =>
	join(ROOT_CIRRUS_PATH, 'logs', deployment.name, deployment.errorLogFilePath ?? `stderr.log`);

export type Deployment = z.infer<typeof DeploymentSchema>;
export type Project = z.infer<typeof ProjectSchema>;

export const isValidProjectConfigSchema = (project: Project) =>
	tryCatchSync(() => ProjectSchema.parse(project));

// check that all project schemas are valid
// @throws
export function isValidProjectConfig(projects: Project[]) {
	const ports: number[] = [];
	for (let i = 0; i < projects.length; i++) {
		isValidProjectConfigSchema(projects[i]);
		ports.push(...projects[i].deployments.map((deployment) => deployment.port));
	}
	// check for same values in ports…
	const uniquePorts = [...new Set(ports)];
	if (uniquePorts.length !== ports.length)
		throw Error('Two or more deployments have the same port number!');
	// return ProjectSchema.parse(projects);
	// TODO check that no deployment names collide
	// TODO check that no domains collide
	// console.log('TODO check that no deployment names or domains collide');
	return true;
}

export function getProjectConfig(projectName: string): Project {
	const { data, error } = tryCatchSync(() =>
		readFileSync(join(ROOT_CIRRUS_PATH, projectName, 'cirrus.json'))
	);
	if (error)
		throw Error(
			`could not find cirrus config file in path ${join(
				ROOT_CIRRUS_PATH,
				projectName,
				'cirrus.json'
			)}`
		);
	// TODO check that cirrus config is valid…
	const { error: projectConfigParseError } = tryCatchSync(() =>
		isValidProjectConfig(JSON.parse(data))
	);
	if (projectConfigParseError) throw projectConfigParseError;
	// if (!project) throw Error('project === null');
	return JSON.parse(data) as Project;
}

function startAppPm2New(projectName: string, deployment: Deployment): Promise<Proc> {
	return new Promise((resolve, reject) => {
		const processOptions: StartOptions = {
			name: deployment.name,
			script: 'npm',
			args: deployment.start ?? 'start',
			min_uptime: 3_600_000,
			max_restarts: 10,
			output: getLogFilePath(deployment),
			error: getErrorLogFilePath(deployment),
			cwd: join(ROOT_CIRRUS_PATH, projectName, deployment.path),
			env: {
				/*  TODO add env support… */
				// something like ...getDeploymentEnv(deployment: Deployment)
				NODE_ENV: 'production',
				PORT: String(deployment.port)
			}
		};

		pm2.start(processOptions, (err: Error, proc: Proc) => {
			if (err) reject(err);
			resolve(proc);
		});
	});
}

// then `cirrus2 deploy <project name>` gets called
export async function deploy(projectName: string) {
	// go to repo
	process.chdir(join(ROOT_CIRRUS_PATH, projectName));
	// read project config file
	const config = getProjectConfig(projectName);
	// run thru deployments
	const processes: Proc[] = [];
	for (let i = 0; i < config.deployments.length; i++) {
		// change dir
		process.chdir(join(ROOT_CIRRUS_PATH, projectName, config.deployments[i].path));
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
		console.log('proc ');
		console.log(proc);
		processes.push(proc);
	}
	// TODO check that all processes started healthy
	console.log('TODO check that all processes started healthy');

	// run through plugins
	await corePlugins({ event: 'deploy', project: config });

	return processes;
}

function createHook(projectName: string) {
	return `
#!/bin/bash

# update working tree
# cd {{cirrus_dir}}/{{app}}
cd ${join(ROOT_CIRRUS_PATH, projectName)}
unset GIT_DIR
# save last commit
LAST_COMMIT=\`git log -1 | awk 'NR==1 {print $2}'\`
# this is basiclly a force pull
# so even if you force pushed this can still work
# git fetch --all
# git reset --hard origin/main

node /Users/rasmus/Desktop/DEV/Web/cirrus/dist/newcli.js deploy ${projectName}
# cirrus deploy ${projectName}
`;
}

export const getWorkingDir = (projectName: string) => join(ROOT_CIRRUS_PATH, projectName);

export async function initProject(projectName: string) {
	// TODO check that projectName isn't "logs", check that name doesnt contain spaces
	// check that name isn't taken

	// create repository for project
	execaCommandSync(`git init ${join(ROOT_CIRRUS_PATH, projectName)}`);

	// make it possible to push to the non-bare repository
	execaCommandSync('git config receive.denyCurrentBranch updateInstead', {
		cwd: join(ROOT_CIRRUS_PATH, projectName)
	});

	// write post-receive hook
	writeHook(projectName);

	// run through plugins
	console.log("TODO fix problem that cirrus.json doesn't exist when initializing project");
	// await corePlugins({ event: 'init', project: null });

	// create basic cirrus.json?? -> we can't,
	// because then the git history is dirty, which
	// blocks pushes… TODO fix this
}

export function writeHook(projectName: string) {
	const hook = createHook(projectName);
	writeFileSync(join(ROOT_CIRRUS_PATH, projectName, '.git', 'hooks', 'post-receive'), hook);
	chmodSync(join(ROOT_CIRRUS_PATH, projectName, '.git', 'hooks', 'post-receive'), '0777');
}

export interface ProjectInfo {
	remote: string;
	ports: number[];
}

export async function getProjectInfo(projectName: string) {
	const config = getProjectConfig(projectName);
	if (!config) throw Error(`Project with name ${projectName} does not exist.`);

	const externalIp = await publicIp.v4();
	const remote = `ssh://${userInfo().username}@${externalIp}${getWorkingDir(projectName)}`;
	const ports = config.deployments.map((deployment) => deployment.port);
	return { remote, ports };
}

export function getProjects(): Project[] {
	const projects: Project[] = [];
	const appFolders = readdirSync(ROOT_CIRRUS_PATH, { withFileTypes: true })
		.filter((ent) => ent.isDirectory())
		.map((ent) => ent.name)
		.filter((folder) => !['logs'].includes(folder));

	for (const projectName of appFolders) {
		const config = getProjectConfig(projectName);
		projects.push(config);
	}
	return projects;
}

export interface NewAppLog {
	deploymentName: string;
	errors: string[]; // error logs
	logs: string[]; // normal logs
}

export async function getLogs(projectName: string) {
	const config = getProjectConfig(projectName);
	const logs: NewAppLog[] = [];
	for (let i = 0; i < config.deployments.length; i++) {
		const { data: error } = tryCatchSync(() =>
			readFileSync(getErrorLogFilePath(config.deployments[i]))?.toString('utf-8')?.split('\n')
		);
		const { data: log } = tryCatchSync(() =>
			readFileSync(getLogFilePath(config.deployments[i]))?.toString('utf-8')?.split('\n')
		);
		logs.push({
			deploymentName: config.deployments[i].name,
			errors: error ?? [],
			logs: log ?? []
		});
	}
	return logs;
}

export async function getDeployments(): Promise<(Deployment & Pm2AppInfo)[]> {
	const projects: Project[] = getProjects();
	const deployments: Deployment[] = projects.reduce(
		(prev: Deployment[], curr) => [...prev, ...curr.deployments],
		[]
	);

	const appInfos: (Deployment & Pm2AppInfo)[] = [];

	for (let i = 0; i < deployments.length; i++) {
		const pm2AppInfo = await getPm2AppInfoNew(deployments[i].name);
		appInfos.push({
			...deployments[i],
			...pm2AppInfo
		});
	}
	return appInfos;
}

async function getPm2AppInfoNew(deploymentName: string): Promise<Pm2AppInfo> {
	return new Promise((resolve, reject) => {
		pm2.list((err: Error, procList: ProcessDescription[]) => {
			if (err) reject(err);
			const proc: ProcessDescription | undefined = procList.find(
				(process: ProcessDescription) => process.name === deploymentName
			);
			resolve({
				cpu: proc?.monit?.cpu ?? 0,
				memory: proc?.monit?.memory ?? 0,
				uptime: Date.now() - (proc?.pm2_env?.pm_uptime ?? Date.now()),
				status: proc?.pm2_env?.status ?? 'stopped'
			});
		});
	});
}
