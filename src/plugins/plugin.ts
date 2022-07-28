// Cirrus core plugins - extend core Cirrus functionality with a simple API

import { Project } from '../init';

export type CirrusPluginType = (opts: CirrusPluginOptions) => Promise<void> | void;

export async function nginx() {}
export async function caddy(opts: CirrusPluginOptions) {}
export async function postgres() {}

export type CirrusEvent = 'init' | 'deploy' | 'delete';

export interface CirrusPluginOptions {
	event: CirrusEvent;
	project: Project;
}

// { plugins: ['caddy', 'postgres'] }
export async function corePlugins(opts: CirrusPluginOptions) {
	const plugins = opts.project.plugins;
	if (!plugins) return;
	for (const plugin of plugins) {
		if (plugin === 'caddy') await caddy(opts);
	}
}
