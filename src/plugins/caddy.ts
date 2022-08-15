// functions for generating Caddyfile from Cirrus configuration
import { readFileSync, writeFileSync } from 'fs';
import { getCirrusLogger } from '../logger';
import { getProjects } from '../project';
import { Deployment } from '../types';
import { executeCommandOrCatch, readFileOrCreate } from '../util';
import { CirrusEvent, CirrusPluginOptions, CirrusPluginType, PluginInterface } from './plugin';

export const getCaddyfilePath = () => process.env.CADDYFILE_PATH ?? '/etc/caddy/Caddyfile';

export function createCaddyfile(deployment: Deployment) {
	if (!deployment.domain) return '';
	return `
${deployment.domain} {
  encode gzip zstd
  reverse_proxy 127.0.0.1:${deployment.port}
}`;
}

export function getCaddyfile() {
	const projects = getProjects();
	let caddyDefinitions = `
# This Caddyfile is autogenerated by Cirrus.
# Modify at your own risk.
#
# Refer to the Caddy docs for more information:
# https://caddyserver.com/docs/caddyfile
`;
	for (let i = 0; i < projects.length; i++) {
		for (const deployment of projects[i].deployments) {
			caddyDefinitions += createCaddyfile(deployment);
		}
	}
	return caddyDefinitions;
}

export function shouldReloadCaddyfile() {
	// TODO(skoshx): support for custom path Caddyfile…
	// const loadedCaddyfile = readFileSync(getCaddyfilePath(), 'utf-8');
	const loadedCaddyfile = readFileOrCreate(getCaddyfilePath());
	const generatedCaddyfile = getCaddyfile();
	return loadedCaddyfile !== generatedCaddyfile;
}

function updateCaddyfile() {
	const generatedCaddyfile = getCaddyfile();
	writeFileSync(getCaddyfilePath(), generatedCaddyfile, 'utf-8');
}

export interface CaddyPluginInterface extends PluginInterface {
	getCaddyfile(): string;
	writeCaddyfile(): string;
	shouldRewriteCaddyfile(): boolean;
	reloadCaddy(): boolean;
}

/* export const caddyPlugin: CaddyPluginInterface = {
	logger: await getCirrusLogger(),
	pluginName: 'Caddy',
	shouldRewriteCaddyfile() {
		const loadedCaddyfile = readFileOrCreate(getCaddyfilePath());
		const generatedCaddyfile = this.getCaddyfile();
		return loadedCaddyfile !== generatedCaddyfile;
	},
	getCaddyfile() {
		const projects = getProjects();
		let caddyDefinitions = `
# This Caddyfile is autogenerated by Cirrus.
# Modify at your own risk.
#
# Refer to the Caddy docs for more information:
# https://caddyserver.com/docs/caddyfile
`;
		for (let i = 0; i < projects.length; i++) {
			for (const deployment of projects[i].deployments) {
				caddyDefinitions += createCaddyfile(deployment);
			}
		}
		return caddyDefinitions;
	},
	writeCaddyfile() {
		this.logger.info(`[${this.pluginName}] - Writing Caddyfile`);
		const generatedCaddyfile = getCaddyfile();
		writeFileSync(getCaddyfilePath(), generatedCaddyfile, 'utf-8');
		return readFileSync(getCaddyfilePath(), 'utf-8');
	},
	reloadCaddy() {
		this.logger.info(`[${this.pluginName}] - Reloading Caddy configuration`);
		executeCommandOrCatch(`caddy reload --config ${getCaddyfilePath()}`);
		return true;
	},
	async run(opts: CirrusPluginOptions) {
		// Logging
		this.logger.info(`[${this.pluginName}] - Event ${opts.event}`);

		// On every invocation check caddyfile
		if (shouldReloadCaddyfile()) {
			this.writeCaddyfile();
			this.reloadCaddy();
		}

		return { data: true, error: null };
	}
}; */

export const caddy: CirrusPluginType = async (opts: CirrusPluginOptions) => {
	const triggers: CirrusEvent[] = ['init', 'delete', 'deploy'];
	if (triggers.includes(opts.event)) {
		if (shouldReloadCaddyfile()) {
			// rewrite caddyfile
			updateCaddyfile();
			// reload caddy
			if (process.env.NODE_ENV !== 'test')
				executeCommandOrCatch(`caddy reload --config ${getCaddyfilePath()}`);
		}
	}
};
