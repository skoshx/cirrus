import { AppOptionsType, PushOptionsType } from './types';
import { homedir } from 'os';
import { join } from 'path';

export function getDefaultAppEnvironment(app: AppOptionsType) {
	return {
		...getDefaultGlobalEnvironment(),
		PORT: app.port
	};
}

export function getDefaultGlobalEnvironment() {
	return {
		NODE_ENV: 'production'
	};
}

export const ROOT_CIRRUS_PATH =
	process.env.CIRRUS_ROOT ?? join(process.env.HOME ?? homedir(), 'cirrus');

export const defaultOptions: PushOptionsType = {
	root: process.env.CIRRUS_ROOT ?? join(process.env.HOME ?? homedir(), 'cirrus'),
	env: getDefaultGlobalEnvironment(),
	minUptime: 3600000,
	maxRestarts: 10,
	repos: []
};
