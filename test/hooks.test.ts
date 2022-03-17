import anyTest, { ExecutionContext, TestFn } from 'ava';
import { createHook } from '../dist/index';
import { setupTestSuite, TestSuiteType, __testDirname } from './_helper';
import { join } from 'path';

const test = anyTest as TestFn<TestSuiteType>;

setupTestSuite(test);

const appHook = (t: ExecutionContext<TestSuiteType>) => `#!/bin/bash

# update working tree
cd ${join(t.context.global.root, 'apps', 'app')}
unset GIT_DIR
# save last commit
LAST_COMMIT=\`git log -1 | awk 'NR==1 {print $2}'\`
# this is basiclly a force pull
# so even if you force pushed this can still work
git fetch --all
git reset --hard origin/main

cd ./ || exit 1
npm install || exit 1
npm run build || exit 1

cirrus stop app
cirrus start app
`;

const monorepoHook = (t: ExecutionContext<TestSuiteType>) => `#!/bin/bash

# update working tree
cd ${join(t.context.global.root, 'apps', 'monorepo')}
unset GIT_DIR
# save last commit
LAST_COMMIT=\`git log -1 | awk 'NR==1 {print $2}'\`
# this is basiclly a force pull
# so even if you force pushed this can still work
git fetch --all
git reset --hard origin/main

cd apps/web || exit 1
npm install || exit 1
npm run build || exit 1
cd ${join(t.context.global.root, 'apps', 'monorepo')}
cd apps/api || exit 1
npm install || exit 1
npm run build || exit 1
cd ${join(t.context.global.root, 'apps', 'monorepo')}

cirrus stop monorepo
cirrus start monorepo
`;

test('hooks > app', async (t) => {
  const hook = createHook('app', t.context.app);
  t.is(hook, appHook(t));
});

test('hooks > monorepo', async (t) => {
  const hook = createHook('monorepo', t.context.monorepo);
  t.is(hook, monorepoHook(t));
});
