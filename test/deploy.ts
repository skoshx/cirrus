import anyTest, { ExecutionContext, TestFn } from 'ava';
import { readFileSync } from 'fs';
import { deploy } from '../src/deploy';
import { getCaddyfile } from '../src/plugins/caddy';
import { getDeployments } from '../src/project';
import { setupTestSuite, TestSuiteType, withProject, __testDirname } from './_helper';

const test = anyTest as TestFn<TestSuiteType>;

setupTestSuite(test);
/*
installDependencies(projectName: string, deployment: Deployment): Promise<boolean>; // fix this, this has to be streamed somehwo
build(projectName: string, deployment: Deployment): Promise<any>;
startApp(projectName: string, deployment: Deployment): Promise<DeploymentInfo>;
runPlugins(projectName: string, plugins: PluginInterface[]): Promise<any>;
*/

/* async function getTestDeployer(t: ExecutionContext<TestSuiteType>) {
	const testDeployer: DeploymentInterface = {
		async runCommand(command, projectName, deployment) {
			t.plan(5);
			// t.assert()
			t.deepEqual(command, 'npm run build');
			t.deepEqual(command, 'npm run install');
			t.deepEqual(command, 'npm run start');
		},
	}
} */

test.todo('deploy > app starts with pm2');
test.todo('deploy > correct env');
test.todo('deploy > stops on error'); // stops if build or npm start fails…

test('deploy > deploy succeeded', async (t) => {
	const deployments = await getDeployments();
	t.assert(deployments.find((someDepl) => someDepl.name === t.context.testapp.deployments[0].name));
});

test('deploy > caddy file is correct', async (t) => {
	const response = await deploy(t.context.testapp.name, withProject({ plugins: ['caddy'] }, {}, true));
	console.log("RESPOSNE ");
	console.log(response);
	t.deepEqual(readFileSync(process.env.CADDYFILE_PATH as string).toString(), getCaddyfile());
});
