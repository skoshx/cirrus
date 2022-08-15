import anyTest, { ExecutionContext, TestFn } from 'ava';
import { execaCommandSync } from 'execa';
import { readFileSync } from 'fs';
import { installCaddy } from '../src/cli';
import { deploy } from '../src/deploy';
import { getCaddyfile } from '../src/plugins/caddy';
import { getDeployments } from '../src/project';
import { setupTestSuite, TestSuiteType, withProject, __testDirname } from './_helper';

const test = anyTest as TestFn<TestSuiteType>;

// setupTestSuite(test);

test.todo('install > installs package managers');
test('install > installs caddy', (t) => {
	t.notThrows(installCaddy);
	const response = execaCommandSync('which caddy');
	t.is(response.stdout, '/usr/bin/caddy');
});
