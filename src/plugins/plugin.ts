// Cirrus core plugins - extend core Cirrus functionality with a simple API

import { Project } from '../types';
import { caddy } from './caddy';

export type CirrusPluginType = (opts: CirrusPluginOptions) => Promise<void> | void;

export async function nginx() {} // TODO
export async function postgres() {} // TODO

export type CirrusEvent = 'init' | 'deploy' | 'delete';

export interface CirrusPluginOptions {
	event: CirrusEvent;
	project: Project;
}

// { plugins: ['caddy', 'postgres'] }
export async function runPlugins(opts: CirrusPluginOptions) {
	const plugins = opts.project.plugins;
	if (!plugins) return;
	for (const plugin of plugins) {
		if (plugin === 'caddy') await caddy(opts);
	}
}
