import { ExecutionContext, TestFn } from 'ava';
import { AppOptionsType, PushOptionsType } from '../dist/index';
import { join } from 'path';
import { rmSync } from 'fs';
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

export function setupTestSuite(test: TestFn<TestSuiteType>, before?: (t: ExecutionContext<TestSuiteType>) => void, after?: (t: ExecutionContext<TestSuiteType>) => void) {
  test.before(async (t) => {
    t.context.global = {
      root: join(__testDirname, 'test'),
      env: { NODE_ENV: 'test' },
      minUptime: ms('1h'),
      maxRestarts: 10,
      apps: {}
    }

    await initCirrus(join(__testDirname, 'cirrus'), t.context.global);

    t.context.app = [{
      appName: 'app',
      port: 8080,
      script: 'build/index.js',
      env: {},
    }];

    t.context.monorepo = [
      {
        appName: 'monorepo-app',
        port: 8080,
        script: 'build/index.js',
        commands: ['cd apps/web', 'npm install', 'npm run build']
      },
      {
        appName: 'monorepo-api',
        port: 8081,
        script: 'build/index.js',
        commands: ['cd apps/api', 'npm install', 'npm run build'],
        env: {
          NODE_ENV: 'production',
          SECRET_KEY: 'abcd'
        }
      },
    ]
    
    if (before) await before(t);
  });
  
  test.after(async (t) => {
    rmSync(join(__testDirname, 'cirrus'), { recursive: true, force: true });
    if (after) await after(t);
  });
}
