import anyTest, { ExecutionContext, TestFn } from 'ava';
import { createApp } from '../src/create';
import { setupTestSuite, TestSuiteType } from './_helper';

const test = anyTest as TestFn<TestSuiteType>;

const before = async (t: ExecutionContext<TestSuiteType>) => {
  await createApp('test', t.context.app);
};

setupTestSuite(test, before);

test.todo('remove > stop app');

/*test('remove > stop app', async (t) => {
  const app = await stopApp('test');
  // todo: creates repository unit tests…
  console.log("stop app: ");
  console.log(app);
  t.fail();
  // t.snapshot(app);
});*/
