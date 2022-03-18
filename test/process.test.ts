import anyTest, { ExecutionContext, TestFn } from 'ava';
import { createHook, initCirrus } from '../dist/index';
import { getApp, removeApp } from '../src';
import { createApp } from '../src/create';
import { setupTestSuite, TestSuiteType, __testDirname } from './_helper';

const test = anyTest as TestFn<TestSuiteType>;

setupTestSuite(test);

test('process > init', async (t) => {
  const globalOptions = await initCirrus(t.context.global);

  t.deepEqual(globalOptions, t.context.global);
});

/*test.serial('process > get app', async (t) => {
  await createApp('testrepo', t.context.app);

  const app = getApp('app');
  t.deepEqual(app, null);
});*/
