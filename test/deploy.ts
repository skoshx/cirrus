import anyTest, { TestFn } from 'ava';
import { readFileSync } from 'fs';
import { deploy } from '../src/deploy';
import { getCaddyfile } from '../src/plugins/caddy';
import { setupTestSuite, TestSuiteType, withProject, __testDirname } from './_helper';

const test = anyTest as TestFn<TestSuiteType>;

setupTestSuite(test);

test.todo('deploy > app starts with pm2');
test.todo('deploy > correct env');
test.todo('deploy > stops on error'); // stops if build or npm start fails…
test('deploy > caddy file is correct', async (t) => {
	await deploy(t.context.testapp.name, withProject({ plugins: ['caddy'] }, {}, true));
	t.deepEqual(readFileSync(process.env.CADDYFILE_PATH as string).toString(), getCaddyfile());
});
