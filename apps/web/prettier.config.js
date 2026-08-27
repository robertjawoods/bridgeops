import * as svelte from "prettier-plugin-svelte";
import * as tailwindcss from "prettier-plugin-tailwindcss";
import base from "../../prettier.config.mjs";

/**
 * Extends the monorepo defaults with the Svelte and Tailwind plugins.
 * prettier-plugin-tailwindcss must stay last — it reorders class lists after
 * every other plugin has run.
 *
 * @type {import("prettier").Config}
 */
export default {
	...base,
	// Imported rather than named, so they still resolve when Prettier runs from
	// the repo root (`pnpm format`) instead of from this directory.
	plugins: [svelte, tailwindcss],
	// Tailwind v4 reads the theme from the stylesheet rather than a JS config.
	tailwindStylesheet: "./src/routes/layout.css",
	overrides: [
		{
			files: "*.svelte",
			options: { parser: "svelte" },
		},
	],
};
