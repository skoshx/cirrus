import anyTest, { ExecutionContext, TestFn } from "ava";
import { createHook, initCirrus } from "../dist/index";
import { setupTestSuite, TestSuiteType, __testDirname } from './_helper';
import { join } from "path";
import ms from "ms";

const test = anyTest as TestFn<TestSuiteType>;

test('process > init', async (t) => {
  const init = await initCirrus(join(__testDirname, 'test'), {
    root: join(__testDirname, 'test'),
    env: { NODE_ENV: 'test' },
    minUptime: ms('1h'),
    maxRestarts: 10,
    apps: {}
  });

  t.deepEqual(init, {
    root: join(__testDirname, 'test'),
    env: { NODE_ENV: 'test' },
    minUptime: ms('1h'),
    maxRestarts: 10,
    apps: {}
  });
});
