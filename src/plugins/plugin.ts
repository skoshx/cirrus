// Cirrus core plugins - extend core Cirrus functionality with a simple API

import { getLogger } from 'logpile';
import { Project } from '../types';
import { TryCatchResponse } from '../util';
import { caddy } from './caddy';
// import { caddy } from './caddy';

export type CirrusPluginType = (opts: CirrusPluginOptions) => Promise<void> | void;

export async function nginx() {} // TODO
export async function postgres() {} // TODO

export type CirrusEvent = 'init' | 'deploy' | 'delete';

export interface CirrusPluginOptions {
	event: CirrusEvent;
	project: Project;
}

export interface PluginInterface {
	get pluginName(): string;
	get logger(): ReturnType<typeof getLogger>;
	run(opts: CirrusPluginOptions): Promise<TryCatchResponse<boolean>>;
}

// { plugins: ['caddy', 'postgres'] }
export async function runPlugins(opts: CirrusPluginOptions) {
	const plugins = opts.project.plugins;
	if (!plugins) return;
	for (const plugin of plugins) {
		if (plugin === 'caddy') await caddy(opts);
	}
}
