import { z } from 'zod';
import { RESERVED_FOLDERS } from './project';

export const DeploymentSchema = z.object({
	path: z.string().default('.'),
	name: z.string(), // TODO check no spaces
	port: z.number(),
	// build: z.string().default('npm run build'),
	// start: z.string().default('npm run start'),
	build: z.string().optional(),
	start: z.string().optional(),
	domain: z
		.string()
		.transform((domain: string) => {
			const transformedDomain = new URL(
				domain.startsWith('http://') || domain.startsWith('https://') ? domain : `http://${domain}`
			).hostname;
			const domainRegex =
				/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/;
			if (!domainRegex.test(transformedDomain)) throw Error(`Invalid domain ${domain}`);
			return transformedDomain;
		})
		.optional(),
	logFilePath: z.string().optional(),
	errorLogFilePath: z.string().optional()
});

export const ProjectSchema = z.object({
	name: z.string().transform((name) => {
		const allowedRegex = /^[A-Za-z0-9_-]*$/;
		if (RESERVED_FOLDERS.includes(name))
			throw new Error(
				`Invalid project name ${name}. Names ${RESERVED_FOLDERS.join(', ')} are reserved.`
			);
		if (!allowedRegex.test(name))
			throw new Error(`Invalid project name ${name}. Only letters, numbers and -_ are allowed.`);
		if (name.indexOf(' ') >= 0)
			throw new Error(`Invalid project name ${name}. No spaces allowed in project name.`);
		return name;
	}),
	deployments: z.array(DeploymentSchema),
	plugins: z.array(z.string()).optional()
});

export type Deployment = z.infer<typeof DeploymentSchema>;
export type Project = z.infer<typeof ProjectSchema>;

export interface ProjectInfo {
	remote: string;
	ports: number[];
}

export type DeploymentInfo = Deployment & Pm2AppInfo;

export interface NewAppLog {
	deploymentName: string;
	errors: string[]; // error logs
	logs: string[]; // normal logs
}

// From PM2 types
export type ProcessStatus =
	| 'online'
	| 'stopping'
	| 'stopped'
	| 'launching'
	| 'errored'
	| 'one-launch-status';

export interface Pm2AppInfo {
	cpu: number;
	memory: number;
	uptime: number;
	status: ProcessStatus;
}
