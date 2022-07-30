import { defineConfig } from 'tsup';

export default defineConfig({
	banner: { js: process.env.NODE_ENV === 'test' ? '' : '#!/usr/bin/env node' }
});
