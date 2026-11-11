import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// Only the sources: svelte-package copies the tests into dist/ and .svelte-kit/ too.
	test: { include: ['src/**/*.test.ts'] }
});
