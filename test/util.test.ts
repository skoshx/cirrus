import anyTest, { ExecutionContext, TestFn } from 'ava';
import { getGlobalOptions } from '../src';
import { createApp } from '../src/create';
import { getAvailablePort } from '../src/util';
import { setupTestSuite, TestSuiteType } from './_helper';

const test = anyTest as TestFn<TestSuiteType>;

const before = async (t: ExecutionContext<TestSuiteType>) => {
	await createApp('test', t.context.app);
};

setupTestSuite(test, before);

test('util > port', async (t) => {
	const port = getAvailablePort();
	t.is(port, 3001);
	t.throws(() => getAvailablePort(t.context.app[0].port));
});
