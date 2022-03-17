import { AppOptionsType, PushOptionsType } from './types';
import { homedir } from 'os';
import { join } from 'path';

export function getDefaultAppEnvironment(app: AppOptionsType) {
  return {
    ...getDefaultGlobalEnvironment(),
    PORT: app.port,
  };
}

export function getDefaultGlobalEnvironment() {
  return {
    NODE_ENV: 'production',
  };
}

export const defaultOptions: PushOptionsType = {
  root:
    process.env.CIRRUS_ROOT ?? join(process.env.HOME ?? homedir(), 'cirrus'),
  env: getDefaultGlobalEnvironment(),
  minUptime: 3600000,
  maxRestarts: 10,
  apps: {},
};
