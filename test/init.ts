import anyTest, { TestFn } from 'ava';
import { join } from 'path';
import { getRootCirrusPath } from '../src/defaults';
import { createHook } from '../src/init';
import { getConfigFromPath } from '../src/util';
import { setupTestSuite, TestSuiteType } from './_helper';

const test = anyTest as TestFn<TestSuiteType>;

setupTestSuite(test);

test('init > git hook', (t) => {
	t.deepEqual(
		createHook('testapp'),
		`
#!/bin/bash

cirrus deploy testapp`
	);
});

test.todo('init > git config');

test('init > writes default config', (t) => {
	const config = getConfigFromPath(
		join(getRootCirrusPath(), 'config', `${t.context.testapp.name}.json`)
	);
	t.deepEqual(config, {
		name: 'test-project',
		plugins: ['caddy'],
		deployments: [
			{
				path: '.',
				name: 'test-project',
				port: 3000,
				start: 'npm run start',
				build: 'npm run build'
			}
		]
	});
});

test.todo('init > env file');
