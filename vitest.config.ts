import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			include: ['src/**'],
			// The floor (.hajime.json `floor`, doc/TESTING.md): what the suite held
			// when kotoba was adopted, measured as CI runs it, without JMdict. It
			// only rises.
			thresholds: { lines: 65, branches: 65, functions: 65 }
		}
	}
});
