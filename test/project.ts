import anyTest, { ExecutionContext, TestFn } from 'ava';
import { initProject } from '../src/init';
import { isValidProjectConfigSchema } from '../src/project';
import { Deployment, Project } from '../src/types';
import { setupTestSuite, TestSuiteType, withProject } from './_helper';

const test = anyTest as TestFn<TestSuiteType>;

setupTestSuite(test);

test.todo('project > config > combines configs correctly');

test('project > config > no clashing project names', async (t) => {
	await t.throwsAsync(initProject(t.context.testapp.name));
});
test.todo('project > config > no clashing deployment names');
test('project > config > no spaces in project name', async (t) => {
	await t.throwsAsync(initProject('test app'));
});
test.todo('project > config > no clashing ports');

test('project > config > allows only valid domains', (t) => {
	t.throws(() => isValidProjectConfigSchema(withProject({}, { domain: 'baddomain' }) as any));
	t.throws(() => isValidProjectConfigSchema(withProject({}, { domain: 'invalid-domain' }) as any));
	isValidProjectConfigSchema(withProject({}, { domain: 'skoshx.com' }) as any);
	isValidProjectConfigSchema(withProject({}, { domain: 'skoshx.co.uk' }) as any);
	isValidProjectConfigSchema(withProject({}, { domain: 'http://skoshx.com' }) as any);
	isValidProjectConfigSchema(withProject({}, { domain: 'subdomain.skoshx.com' }) as any);
});
