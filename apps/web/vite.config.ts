import tailwindcss from "@tailwindcss/vite";
import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		port: 5173,
		allowedHosts: [
			"localhost",
			"zeke-monohydroxy-unscrupulously.ngrok-free.dev",
		],
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				experimental: {
					async: true,
				},
			},
			experimental: {
				remoteFunctions: true,
			},
			adapter: adapter(),
		}),
		varlockVitePlugin(),
	],
});
