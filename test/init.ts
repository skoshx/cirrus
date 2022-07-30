import anyTest, { TestFn } from 'ava';
import { createHook } from '../src/init';
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

test.todo('init > env file');
