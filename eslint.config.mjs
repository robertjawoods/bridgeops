import base from "./eslint.config.base.mjs";

/**
 * Root-level files only (Vitest config, scripts). Each workspace package has
 * its own `eslint.config.js`; `pnpm lint` fans out to them via Turbo.
 */
export default [
	...base,
	{
		ignores: ["apps/**", "packages/**"],
	},
];
