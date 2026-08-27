import globals from "globals";
import svelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";
import base from "../../eslint.config.base.mjs";

/**
 * svelte-eslint-parser normally reads these from `svelte.config.js`, but this
 * app passes its Svelte options inline to `sveltekit()` in `vite.config.ts`.
 * `experimental.async` is what lets the parser accept `{#each await ...}` in
 * markup; keep this in sync with the Vite config.
 *
 * @type {import('svelte/compiler').CompileOptions}
 */
const svelteConfig = {
	compilerOptions: {
		experimental: {
			async: true,
		},
	},
	kit: {
		experimental: {
			remoteFunctions: true,
		},
	},
};

export default tseslint.config(
	...base,
	svelte.configs.recommended,
	{
		languageOptions: {
			globals: { ...globals.browser },
		},
	},
	{
		files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
				svelteConfig,
			},
		},
	},
	svelte.configs.prettier,
);
