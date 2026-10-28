import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import ts from 'typescript-eslint';

export default defineConfig(
	includeIgnoreFile(path.resolve(import.meta.dirname, '.gitignore')),
	js.configs.recommended,
	// kotoba is TypeScript (run by Node's type stripping), which the house
	// config's JavaScript-only rules cannot parse.
	ts.configs.recommended,
	prettier,
	{
		languageOptions: { globals: { ...globals.node } },
		rules: {
			// An unused binding is either dead code or a forgotten use; `_` marks
			// the deliberate ones (a callback's ignored argument).
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	}
);
