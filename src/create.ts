import { execa, execaCommand } from 'execa';
import { createHook } from './hooks';
import { getGlobalOptions, getRepository } from './process';
import { AppOptions, AppOptionsType, PushOptionsType, RepositoryType } from './types';
import { clone, getRepoPath, getWorkPath, saveConfig, tryCatch } from './util';
import { writeFileSync, mkdirSync, chmodSync, existsSync } from 'fs';
import { join } from 'path';

export function createRepoDefinition(
	repositoryName: string,
	appOptions: AppOptionsType[],
	options: PushOptionsType
) {
	const optionsClone: PushOptionsType = clone(options);
	if (getRepository(repositoryName, options))
		throw Error(`A repository with name ${repositoryName} already exists.`);

	const repository: RepositoryType = {
		repositoryName,
		apps: appOptions.map((app: AppOptionsType) => {
			const parsedOptions = AppOptions.parse(app);
			return {
				logFile: join(options.root, 'logs', repositoryName, `${app.appName}.log`),
				errorFile: join(options.root, 'logs', repositoryName, `${app.appName}.error.log`),
				script: 'build/index.js',
				commands: ['npm install', 'npm run build'],
				instances: 1,
				path: './',
				...parsedOptions,
				env: {
					...optionsClone.env,
					...parsedOptions.env
				}
			};
		})
	};
	optionsClone.repos.push(repository);
	return optionsClone;
}

export async function createApp(
	repositoryName: string,
	apps: AppOptionsType[]
): Promise<RepositoryType> {
	if (getRepository(repositoryName))
		throw Error(`Repository with name ${repositoryName} exists already.`);

	saveConfig(createRepoDefinition(repositoryName, apps, getGlobalOptions()));

	/* const { error } = await tryCatch<boolean>(
    options.remote
      ? createRemoteApp(appName, options)
      : createAppRepo(appName, options),
  ); */

	const hook = createHook(repositoryName, apps);
	const { error } = await tryCatch<boolean>(createAppRepo(repositoryName, hook));
	if (error) throw error;

	// Return created app
	return getRepository(repositoryName);
}

export async function createRemoteApp(appName: string, hook: string): Promise<boolean> {
	throw Error(
		`Support for GitHub remote has not been added yet. Feel free to open a Pull Request.`
	);
}

export async function createAppRepo(appName: string, hook: string): Promise<boolean> {
	// Create directory
	mkdirSync(getRepoPath(appName), { recursive: true });
	// mkdirSync(getWorkPath(appName), { recursive: true });

	// Bare git repo
	const { stderr, exitCode } = await execaCommand(
		`git --git-dir ${getRepoPath(appName)} --bare init`
	);
	if (exitCode && exitCode !== 0) throw stderr ?? 'creating bare git repo failed';

	// Create hook
	updateHook(appName, hook);

	// Clone empty working copy
	const { stderr: cloneEmptyError, exitCode: cloneExitCode } = await execaCommand(
		`git clone ${getRepoPath(appName)} ${getWorkPath(appName)}`
	);
	if (cloneExitCode && cloneExitCode !== 0)
		throw cloneEmptyError ?? 'cloning empty working copy failed';
	return true;
}

export function updateHook(repositoryName: string, hook: string) {
	writeFileSync(`${getRepoPath(repositoryName)}/hooks/post-receive`, hook);
	chmodSync(`${getRepoPath(repositoryName)}/hooks/post-receive`, '0777');
}
