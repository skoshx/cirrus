import anyTest, { TestFn } from 'ava';
import { TestSuiteType, __testDirname } from './_helper';

const test = anyTest as TestFn<TestSuiteType>;

test.todo('plugins > run plugins');
test.todo('plugins > caddy');
test.todo('plugins > postgres');
test.todo('plugins > firewall');
