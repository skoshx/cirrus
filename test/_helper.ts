import { ExecutionContext, TestFn } from 'ava';
import { AppOptionsType, PushOptionsType } from '../dist/index';
import { join } from 'path';
import { rmSync, existsSync } from 'fs';
import { initCirrus } from '../dist/index';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ms from 'ms';

export interface TestSuiteType {
  global: PushOptionsType;
  app: AppOptionsType[];
  monorepo: AppOptionsType[];
}

export const __testDirname = dirname(fileURLToPath(import.meta.url));

export function setupTestSuite(
  test: TestFn<TestSuiteType>,
  before?: (t: ExecutionContext<TestSuiteType>) => void,
  after?: (t: ExecutionContext<TestSuiteType>) => void,
) {
  test.before(async (t) => {
    t.context.global = {
      root: join(__testDirname, 'cirrus'),
      env: { NODE_ENV: 'test' },
      minUptime: ms('1h'),
      maxRestarts: 10,
      repos: [],
    };

    // delete cirrus folder if exists
    if (existsSync(t.context.global.root))
      rmSync(t.context.global.root, { recursive: true });

    await initCirrus(t.context.global);

    t.context.app = [
      {
        appName: 'app',
        port: 3000,
        commands: ['npm install', 'npm run build'],
        env: {},
      },
    ];

    t.context.monorepo = [
      {
        appName: 'monorepo-app',
        port: 3000,
        path: 'apps/web',
        commands: ['npm install', 'npm run build'],
      },
      {
        appName: 'monorepo-api',
        port: 3001,
        path: 'apps/api',
        commands: ['npm install', 'npm run build'],
        env: {
          NODE_ENV: 'production',
          SECRET_KEY: 'abcd',
        },
      },
    ];

    if (before) await before(t);
  });

  test.after(async (t) => {
    rmSync(join(__testDirname, 'cirrus'), { recursive: true, force: true });
    if (after) await after(t);
  });
}
