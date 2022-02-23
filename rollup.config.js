import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import json from '@rollup/plugin-json';
import preserveShebang from 'rollup-plugin-preserve-shebang';

const name = require('./package.json').main.replace(/\.cjs$/, '');

const bundle = (config) => ({
  ...config,
  input: './src/cli.ts',
  external: (id) => !/^[./]/.test(id),
});

export default [
  bundle({
    plugins: [json(), esbuild(), preserveShebang()],
    output: [
      {
        file: `${name}.cli.cjs`,
        format: 'cjs',
        sourcemap: true,
        banner: '#!/usr/bin/env node',
      },
      {
        file: `${name}.cli.mjs`,
        format: 'esm',
        sourcemap: true,
        banner: '#!/usr/bin/env node',
      },
    ],
  }),
  {
    input: './src/index.ts',
    external: (id) => !/^[./]/.test(id),
    plugins: [json(), esbuild()],
    output: [
      {
        file: `${name}.mjs`,
        format: 'esm',
        sourcemap: true,
      },
      {
        file: `${name}.cjs`,
        format: 'cjs',
        sourcemap: true,
      },
    ],
  },
  {
    input: './src/index.ts',
    external: (id) => !/^[./]/.test(id),
    plugins: [dts()],
    output: [
      {
        file: `${name}.d.ts`,
        format: 'esm',
      },
    ],
  },
  /* bundle({
    plugins: [dts()],
    output: {
      file: `${name}.d.ts`,
      format: 'esm',
    },
  }), */
];
