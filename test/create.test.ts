import anyTest, { ExecutionContext, TestFn } from 'ava';
import ms from 'ms';
import { createApp, createRepoDefinition } from '../src/create';
import { setupTestSuite, TestSuiteType, __testDirname } from './_helper';
import { join } from 'path';
import { getGlobalOptions, RepositoryType } from '../src';
import { saveConfig } from '../src/util';

const test = anyTest as TestFn<TestSuiteType>;

setupTestSuite(test);

test('create > globals', async (t) => {
  t.deepEqual(getGlobalOptions(), t.context.global);
});

test('create > monorepo options', async (t) => {
  const monorepoGlobalOptions = createRepoDefinition(
    'monorepo',
    t.context.monorepo,
    t.context.global,
  );
  t.throws(() =>
    createRepoDefinition('monorepo', t.context.monorepo, monorepoGlobalOptions),
  );
  t.deepEqual(monorepoGlobalOptions, {
    root: join(__testDirname, 'cirrus'),
    env: { NODE_ENV: 'test' },
    minUptime: ms('1h'),
    maxRestarts: 10,
    repos: [
      {
        repositoryName: 'monorepo',
        apps: [
          {
            ...t.context.monorepo[0],
            errorFile: join(
              __testDirname,
              'cirrus',
              'logs',
              'monorepo',
              'monorepo-app.error.log',
            ),
            logFile: join(
              __testDirname,
              'cirrus',
              'logs',
              'monorepo',
              'monorepo-app.log',
            ),
            env: { NODE_ENV: 'test' },
            path: 'apps/web',
            script: 'build/index.js',
            instances: 1,
          },
          {
            ...t.context.monorepo[1],
            errorFile: join(
              __testDirname,
              'cirrus',
              'logs',
              'monorepo',
              'monorepo-api.error.log',
            ),
            logFile: join(
              __testDirname,
              'cirrus',
              'logs',
              'monorepo',
              'monorepo-api.log',
            ),
            env: {
              NODE_ENV: 'production',
              SECRET_KEY: 'abcd',
            },
            path: 'apps/api',
            script: 'build/index.js',
            instances: 1,
          },
        ],
      },
    ],
  });
});

test('create > app options', async (t) => {
  const globalOptions = createRepoDefinition(
    'app',
    t.context.app,
    t.context.global,
  );
  t.throws(() => createRepoDefinition('app', t.context.app, globalOptions));
  t.deepEqual(globalOptions, {
    root: join(__testDirname, 'cirrus'),
    env: { NODE_ENV: 'test' },
    minUptime: ms('1h'),
    maxRestarts: 10,
    repos: [
      {
        repositoryName: 'app',
        apps: [
          {
            ...t.context.app[0],
            path: './',
            errorFile: join(
              __testDirname,
              'cirrus',
              'logs',
              'app',
              'app.error.log',
            ),
            logFile: join(__testDirname, 'cirrus', 'logs', 'app', 'app.log'),
            env: { NODE_ENV: 'test' },
            script: 'build/index.js',
            commands: ['npm install', 'npm run build'],
            instances: 1,
          },
        ],
      },
    ],
  });
});

test('create > local', async (t) => {
  const repository: RepositoryType = await createApp('test', t.context.app);
  const createdAppFixture = {
    ...t.context.app[0],
    commands: ['npm install', 'npm run build'],
    env: { NODE_ENV: 'test' },
    logFile: join(__testDirname, 'cirrus', 'logs', 'test', 'app.log'),
    errorFile: join(__testDirname, 'cirrus', 'logs', 'test', 'app.error.log'),
    instances: 1,
    path: './',
  };
  const createdRepositoryFixture = {
    repositoryName: 'test',
    apps: [createdAppFixture],
  };
  t.deepEqual(repository, createdRepositoryFixture);
  const options = getGlobalOptions();
  t.deepEqual(options, {
    ...t.context.global,
    repos: [
      {
        repositoryName: 'test',
        apps: [createdAppFixture],
      },
    ],
  });
  // TODO: check folders etc…
});

test.todo('create > remote');

/* test('create > remote', async (t) => {
  const appFromRemote = {
    ...t.context.app[0],
    remote: 'https://github.com/skoshx/cirrus'
  };
  const app = await createApp('test_remote', [appFromRemote]);
  // todo: check repository & folders created
}); */
