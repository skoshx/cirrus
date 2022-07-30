import { readdirSync, readFileSync } from 'fs';
import { userInfo } from 'os';
import publicIp from 'public-ip';
import { Deployment, NewAppLog, Pm2AppInfo, Project, ProjectSchema } from './types';
import {
	createDirectory,
	getErrorLogFilePath,
	getLogFilePath,
	getWorkingDir,
	tryCatchSync
} from './util';
import pm2, { ProcessDescription } from 'pm2';
import { join } from 'path';
import { getRootCirrusPath } from './defaults';

export async function getProjectInfo(projectName: string) {
	const config = getProjectConfig(projectName);
	if (!config) throw Error(`Project with name ${projectName} does not exist.`);

	const externalIp = await publicIp.v4();
	// const externalIp = 'abcd';
	const remote = `ssh://${userInfo().username}@${externalIp}${getWorkingDir(projectName)}`;
	const ports = config.deployments.map((deployment) => deployment.port);
	return { remote, ports };
}

export function getProjects(): Project[] {
	const projects: Project[] = [];
	createDirectory(getRootCirrusPath());
	const appFolders = readdirSync(getRootCirrusPath(), { withFileTypes: true })
		.filter((ent) => ent.isDirectory())
		.map((ent) => ent.name)
		.filter((folder) => !['logs', 'env'].includes(folder));

	for (const projectName of appFolders) {
		const config = getProjectConfig(projectName);
		projects.push(config);
	}
	return projects;
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

const getDefaultProjectConfig = (projectName: string): Project => ({
	name: projectName,
	deployments: []
});

export const isValidProjectConfigSchema = (project: Project) => ProjectSchema.parse(project);

// check that all project schemas are valid
// @throws
export async function isValidProjectConfig(project: Project) {
	const allProjects = getProjects();

	// check schemas
	allProjects.forEach((project) => isValidProjectConfigSchema(project));

	const allDeployments = await getDeployments();
	const ports = allDeployments.map((deployment) => deployment.port);
	const deploymentNames = allDeployments.map((deployment) => deployment.name);
	const projectNames = allProjects.map((project) => project.name);
	const domains = allDeployments
		.map((deployment) => deployment.domain)
		.filter((domain) => domain !== undefined) as string[];

	// no clashing ports
	if ([...new Set(ports)].length !== ports.length)
		throw Error(`Two or more deployments have the same port number!`);
	// no deployment names collide
	if ([...new Set(deploymentNames)].length !== deploymentNames.length)
		throw Error(`Two or more deployments have the same name!`);
	// no deployment names collide
	if ([...new Set(projectNames)].length !== projectNames.length)
		throw Error(`Two or more projects have the same name!`);
	// no domains collide
	if ([...new Set(domains)].length !== domains.length)
		throw Error(`Two or more deployments have the same domain!`);

	return true;
}

export function getProjectConfig(projectName: string): Project {
	const { data, error } = tryCatchSync(() =>
		readFileSync(join(getRootCirrusPath(), projectName, 'cirrus.json'))
	);
	if (error) return getDefaultProjectConfig(projectName);
	if (!data)
		throw new Error(
			`cirrus.json file at ${join(getRootCirrusPath(), projectName, 'cirrus.json')} doesn't exist.`
		);
	isValidProjectConfig(JSON.parse(data.toString()));
	if (!data) throw Error(`cirrus.json is null`);
	return ProjectSchema.parse(JSON.parse(data.toString()));
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
