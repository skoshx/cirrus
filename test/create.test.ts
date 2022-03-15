import anyTest, { ExecutionContext, TestFn } from "ava";
import ms from "ms";
import { createApp, createAppDefinition } from "../src/create";
import { setupTestSuite, TestSuiteType, __testDirname } from './_helper';
import { join } from 'path';

const test = anyTest as TestFn<TestSuiteType>;

setupTestSuite(test);

test('create > monorepo options', async (t) => {
  const monorepoGlobalOptions = createAppDefinition('monorepo', t.context.monorepo, t.context.global);
  t.throws(() => createAppDefinition('monorepo', t.context.monorepo, monorepoGlobalOptions));
  t.deepEqual(monorepoGlobalOptions, {
    root: join(__testDirname, 'test'),
    env: { NODE_ENV: 'test' },
    minUptime: ms('1h'),
    maxRestarts: 10,
    apps: {
      monorepo: [
        {
          ...t.context.monorepo[0],
          errorFile: join(__testDirname, 'test', 'logs', 'monorepo', 'monorepo-app.error.log'),
          logFile: join(__testDirname, 'test', 'logs', 'monorepo', 'monorepo-app.log'),
          env: { NODE_ENV: 'test' },
          script: 'build/index.js',
          instances: 1,
          remote: null,
        },
        {
          ...t.context.monorepo[1],
          errorFile: join(__testDirname, 'test', 'logs', 'monorepo', 'monorepo-api.error.log'),
          logFile: join(__testDirname, 'test', 'logs', 'monorepo', 'monorepo-api.log'),
          env: {
            NODE_ENV: 'production',
            SECRET_KEY: 'abcd'
          },
          script: 'build/index.js',
          instances: 1,
          remote: null,
        }
      ]
    }
  });
});

test('create > app options', async (t) => {
  const globalOptions = createAppDefinition('app', t.context.app, t.context.global);
  t.throws(() => createAppDefinition('app', t.context.app, globalOptions));
  t.deepEqual(globalOptions, {
    root: join(__testDirname, 'test'),
    env: { NODE_ENV: 'test' },
    minUptime: ms('1h'),
    maxRestarts: 10,
    apps: {
      app: [{
        ...t.context.app[0],
        errorFile: join(__testDirname, 'test', 'logs', 'app', 'app.error.log'),
        logFile: join(__testDirname, 'test', 'logs', 'app', 'app.log'),
        env: { NODE_ENV: 'test' },
        script: 'build/index.js',
        commands: ['npm install', 'npm run build'],
        instances: 1,
        remote: null,
      }]
    }
  });
});

test.todo('create > local');
test.todo('create > remote');

/*test('create > local', async (t) => {
  const app = await createApp('test', t.context.app);
  // todo: check repository & folders created
});

test('create > remote', async (t) => {
  const appFromRemote = {
    ...t.context.app[0],
    remote: 'https://github.com/skoshx/cirrus'
  };
  const app = await createApp('test_remote', [appFromRemote]);
  // todo: check repository & folders created
});*/
