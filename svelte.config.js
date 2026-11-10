import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// The showcase site (src/routes) is prerendered into build/; it is not part of the npm package.
		adapter: adapter({ pages: 'build', assets: 'build', precompress: true, strict: false }),
		alias: {
			// The live examples import the published package name; resolve it to the local source.
			'@atom-forge/brickee': 'src/lib',
			// The showcase site's shell, sample documents and example plugins.
			$site: 'src/site'
		}
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
