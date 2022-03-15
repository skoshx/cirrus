import anyTest, { ExecutionContext, TestFn } from "ava";
import { removeApp } from "../src";
import { createApp } from "../src/create";
import { setupTestSuite, TestSuiteType } from './_helper';

const test = anyTest as TestFn<TestSuiteType>;

const before = async (t: ExecutionContext<TestSuiteType>) => {
  await createApp('test', t.context.app);
}

setupTestSuite(test, before);

test.todo('remove > remove app');

/*test('remove > remove app', async (t) => {
  const app = await removeApp('test');
  // todo: creates repository unit tests…
  console.log("remove app: ");
  console.log(app);
  t.fail();
  // t.snapshot(app);
});*/
