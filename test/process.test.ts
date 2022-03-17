import anyTest, { ExecutionContext, TestFn } from 'ava';
import { createHook, initCirrus } from '../dist/index';
import { setupTestSuite, TestSuiteType, __testDirname } from './_helper';

const test = anyTest as TestFn<TestSuiteType>;

setupTestSuite(test);

test('process > init', async (t) => {
  const globalOptions = await initCirrus(t.context.global);

  t.deepEqual(globalOptions, t.context.global);
});
