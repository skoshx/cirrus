// Post-receive hooks
import { AppOptions, AppOptionsType } from './types';
import { readFileSync } from 'fs';
import { join } from 'path';
import { __dirname } from './constants';
import { getGlobalOptions } from './process';

const hookTemplate = readFileSync(
  join(__dirname, '..', 'hooks', 'post-receive'),
  'utf-8',
);

export function createHook(appName: string, apps: AppOptionsType[]): string {
  const options = getGlobalOptions();
  const commands = apps
    .map((app: AppOptionsType) => {
      if (!app.commands) return [];

      return [
        `cd ${app.path ?? './'} || handle_error "cd" 1`,
        ...(app.commands.map(
          (command: string) => `${command} || handle_error "${command}" 1`,
        ) ?? []),
        `cd {{cirrus_dir}}/apps/{{app}} || handle_error "cd" 1`,
      ];
    })
    .reduce((prevCommands, currentCommands) => [
      ...prevCommands,
      ...currentCommands,
    ])
    .join('\n');

  return hookTemplate
    .replace(/\{\{commands\}\}/g, commands)
    .replace(/\{\{cirrus_dir\}\}/g, options.root)
    .replace(/\{\{app\}\}/g, appName);
}
