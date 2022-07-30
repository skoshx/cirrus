import { homedir } from 'os';
import { join } from 'path';

/* export const ROOT_CIRRUS_PATH = process.env.CIRRUS_ROOT ?? join(process.env.HOME ?? homedir(), 'cirrus'); */

export const getRootCirrusPath = () =>
	process.env.CIRRUS_ROOT ?? join(process.env.HOME ?? homedir(), 'cirrus');
