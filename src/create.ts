import { execa, execaCommand } from 'execa';
import { createHook } from './hooks';
import { getApp, getGlobalOptions } from './process';
import { AppOptions, AppOptionsType, PushOptionsType } from './types';
import { clone, getRepoPath, getWorkPath, saveConfig, tryCatch } from './util';
import { writeFileSync, mkdirSync, chmodSync, existsSync } from 'fs';
import { join } from 'path';
/*

appName: z.string(),
  port: z.number(),
  errorFile: z.string().optional(),
  logFile: z.string().optional(),
  script: z.string().default('build/index.js'),
  env: z.object({}).catchall(z.string()).optional(),
  instances: z.number().optional(),
*/

export function createAppDefinition(
  appName: string,
  appOptions: AppOptionsType[],
  options: PushOptionsType,
) {
  const optionsClone = clone(options);
  if (optionsClone.apps[appName])
    throw Error(`An app with name ${appName} already exists.`);

  // @ts-ignore
  optionsClone.apps[appName] = appOptions.map((app: AppOptionsType) => {
    const parsedOptions = AppOptions.parse(app);
    return {
      logFile: join(options.root, 'logs', appName, `${app.appName}.log`),
      errorFile: join(
        options.root,
        'logs',
        appName,
        `${app.appName}.error.log`,
      ),
      script: 'build/index.js',
      commands: ['npm install', 'npm run build'],
      instances: 1,
      path: './',
      ...parsedOptions,
      env: {
        ...optionsClone.env,
        ...parsedOptions.env,
      },
    };
  });
  return optionsClone;
}

export async function createApp(
  appName: string,
  apps: AppOptionsType[],
): Promise<AppOptionsType[]> {
  if (getApp(appName)) throw Error(`App with name ${appName} exists already.`);

  saveConfig(createAppDefinition(appName, apps, getGlobalOptions()));

  /* const { error } = await tryCatch<boolean>(
    options.remote
      ? createRemoteApp(appName, options)
      : createAppRepo(appName, options),
  ); */

  const hook = createHook(appName, apps);
  const { error } = await tryCatch<boolean>(createAppRepo(appName, hook));
  if (error) throw error;

  // TODO: here pass plugins
  console.log('TODO: Here ppass plugins…');

  // Return created app
  return getApp(appName);
}

export async function createRemoteApp(
  appName: string,
  hook: string,
): Promise<boolean> {
  throw Error(
    `Support for GitHub remote has not been added yet. Feel free to open a Pull Request.`,
  );
  // const { stderr } = await execa(`git clone ${options.remote} \"${getWorkPath(appName)}\"`);
  // if (stderr) throw stderr;
  return true;
}

export async function createAppRepo(
  appName: string,
  hook: string,
): Promise<boolean> {
  // Create directory
  mkdirSync(getRepoPath(appName), { recursive: true });

  // Bare git repo
  const { stderr, exitCode } = await execaCommand(
    `git --git-dir ${getRepoPath(appName)} --bare init`,
  );
  if (exitCode && exitCode !== 0)
    throw stderr ?? 'creating bare git repo failed';

  // Create hook
  writeFileSync(`${getRepoPath(appName)}/hooks/post-receive`, hook);
  chmodSync(`${getRepoPath(appName)}/hooks/post-receive`, '0777');

  // Clone empty working copy
  /* const { stderr: cloneEmptyError, exitCode: cloneExitCode } = await execaCommand(`git clone ${getRepoPath(appName)} \"${getWorkPath(appName)}\"`);
  if (cloneExitCode && cloneExitCode !== 0) throw (cloneEmptyError ?? 'cloning empty working copy failed'); */
  return true;
}
