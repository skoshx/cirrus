import { ExecutionContext, TestFn } from 'ava';
import { join } from 'path';
import { existsSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createDirectory } from '../src/util';
import { Deployment, Project } from '../src/types';
import { initProject } from '../src/init';

export interface TestSuiteType {
	testapp: Project;
}

export const __testDirname = dirname(fileURLToPath(import.meta.url));

export const mockProject: Project = {
	name: 'mockproject',
	plugins: ['caddy'],
	deployments: [
		{
			name: 'mock-deployment',
			path: '.',
			port: 3000,
			start: 'npm run start',
			build: 'npm run build'
		}
	]
};

export function withProject(
	project: Partial<Project>,
	deployment?: Partial<Deployment>,
	removeDeployments = false
) {
	return {
		...mockProject,
		...project,
		deployments: removeDeployments
			? []
			: [
					{
						...mockProject.deployments[0],
						...deployment
					}
			  ]
	};
}

export function setupTestSuite(
	test: TestFn<TestSuiteType>,
	before?: (t: ExecutionContext<TestSuiteType>) => void,
	after?: (t: ExecutionContext<TestSuiteType>) => void
) {
	test.before(async (t) => {
		createDirectory(join(__testDirname, 'cirrus'));
		createDirectory(join(__testDirname, 'caddy'));
		process.env.CIRRUS_ROOT = join(__testDirname, 'cirrus');
		process.env.CADDYFILE_PATH = join(__testDirname, 'caddy', 'Caddyfile');

		t.context.testapp = initProject('test-project');
		if (before) await before(t);
	});

	test.after.always(async (t) => {
		// Clean up Cirrus
		if (existsSync(join(__testDirname, 'cirrus')))
			rmSync(join(__testDirname, 'cirrus'), { recursive: true });
		if (existsSync(join(__testDirname, 'caddy', 'Caddyfile')))
			rmSync(join(__testDirname, 'caddy'), { recursive: true });
		if (after) await after(t);
	});
}
