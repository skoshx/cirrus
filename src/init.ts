import { execaCommandSync } from 'execa';
import { join } from 'path';
import { writeFileSync, chmodSync } from 'fs';
import { getEnvironmentFile } from './env';
import { getProjectConfig, getProjects } from './project';
import { getRootCirrusPath } from './defaults';
import { Project } from './types';
import { getWorkingDir } from './util';

export function createHook(projectName: string) {
	return `
#!/bin/bash

cirrus deploy ${projectName}`;
}

export function initProject(projectName: string) {
	// TODO check that projectName isn't "logs", check that name doesnt contain spaces
	// check that name isn't taken
	const projects = getProjects();
	const existingProject = projects.find((project) => project.name === projectName);
	if (existingProject) throw new Error(`Project name ${projectName} is already taken.`);

	// create repository for project
	execaCommandSync(`git init ${join(getRootCirrusPath(), projectName)}`);

	// make it possible to push to the non-bare repository
	execaCommandSync('git config receive.denyCurrentBranch updateInstead', {
		cwd: join(getRootCirrusPath(), projectName)
	});

	// write post-receive hook
	writeHook(projectName);

	// run through plugins
	// await corePlugins({ event: 'init', project: null });

	// write .env file
	getEnvironmentFile(projectName);

	return getProjectConfig(projectName);
}

export function writeHook(projectName: string) {
	const hook = createHook(projectName);
	writeFileSync(join(getRootCirrusPath(), projectName, '.git', 'hooks', 'post-receive'), hook);
	chmodSync(join(getRootCirrusPath(), projectName, '.git', 'hooks', 'post-receive'), '0777');
}
