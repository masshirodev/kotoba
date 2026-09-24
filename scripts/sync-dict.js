#!/usr/bin/env node
/**
 * Copy kuromoji's dictionary into an app's static folder, so the app serves it
 * itself:
 *
 *   kotoba-sync-dict static/dict
 *
 * A CDN is rejected deliberately: the lookup exists to work while reading,
 * and a CDN would make it stop the moment the network does. ~18MB of .dat.gz:
 * apps gitignore the copy and run this from `prepare`.
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

const dest = resolve(process.argv[2] ?? 'static/dict');
const require = createRequire(import.meta.url);
const src = join(dirname(require.resolve('@patdx/kuromoji/package.json')), 'dict');

if (!existsSync(src)) {
	console.error(`kuromoji dictionary not found at ${src} -- run an install in kotoba first`);
	process.exit(1);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`dictionary synced: ${readdirSync(dest).length} files -> ${dest}`);
