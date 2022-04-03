// functions for generating Caddyfile from Cirrus configuration

import { AppOptionsType } from './types';
import { getConfig } from './util';
import { readFileSync } from 'fs';

export function createCaddyfile(app: AppOptionsType): string {
  if (!app.domain) return '';
  return `
  ${app.domain} {
    encode gzip zstd
    reverse_proxy 127.0.0.1:${app.port}
  }
  `;
}

export function getCaddyfile() {
  const globalOptions = getConfig();
  let caddyDefinitions = `
  # This Caddyfile is autogenerated by Cirrus.
  # Modify at your own risk.
  #
  # Refer to the Caddy docs for more information:
  # https://caddyserver.com/docs/caddyfile
  `;
  for (let i = 0; i < globalOptions.repos.length; i++) {
    const repo = globalOptions.repos[i];
    repo.apps.forEach((app) => {
      caddyDefinitions += createCaddyfile(app);
    });
  }
  return caddyDefinitions;
}

export function shouldReloadCaddyfile() {
  // TODO(skoshx): support for custom path Caddyfile…
  const loadedCaddyfile = readFileSync(`/etc/caddy/Caddyfile`, 'utf-8');
  const generatedCaddyfile = getCaddyfile();
  return loadedCaddyfile === generatedCaddyfile;
}
