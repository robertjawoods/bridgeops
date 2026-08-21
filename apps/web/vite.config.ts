import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { varlockVitePlugin } from '@varlock/vite-integration';
import { defineConfig } from 'vite';
import biomePlugin from 'vite-plugin-biome';

export default defineConfig({
	server: {
		port: 5173,
		allowedHosts: ['localhost', 'zeke-monohydroxy-unscrupulously.ngrok-free.dev']
	},
	plugins: [
		tailwindcss(),
		biomePlugin({
			mode: 'check',
			files: 'src',
			applyFixes: true,
		}),
		sveltekit({
			compilerOptions: {
				experimental: {
					async: true,
				}
			},
			experimental: {
				remoteFunctions: true,
			},
			adapter: adapter(),
		}),
		varlockVitePlugin()
	]
});
