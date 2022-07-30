import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createDirectory, tryCatchSync } from './util';
import dotenv from 'dotenv';
import { getRootCirrusPath } from './defaults';

// gets contents of env file if exists, otherwise create file
export function getEnvironmentFile(envFile: string): string {
	createDirectory(join(getRootCirrusPath(), 'env'));
	const { data, error } = tryCatchSync(() =>
		readFileSync(join(getRootCirrusPath(), 'env', envFile))
	);
	if (error) {
		const { error: writeEnvError } = tryCatchSync(() =>
			writeFileSync(join(getRootCirrusPath(), 'env', envFile), '')
		);
		if (writeEnvError) throw writeEnvError;
		return '';
	}
	if (!data) throw new Error('data === null');
	return data.toString();
}

export function getCirrusEnvironment(): Record<string, string> {
	const variables = getEnvironmentFile('cirrus.env');
	const config = dotenv.parse(variables.toString());
	return config;
}

export function getProjectEnvironment(projectName: string): Record<string, string> {
	const variables = getEnvironmentFile(`${projectName}.env`);
	const config = dotenv.parse(variables);
	return config;
}
