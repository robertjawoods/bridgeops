/**
 * Shared Prettier options for the whole monorepo.
 *
 * `apps/web` extends this with the Svelte and Tailwind plugins; every other
 * package picks it up directly via Prettier's config lookup.
 *
 * @type {import("prettier").Config}
 */
export default {
	useTabs: true,
	semi: true,
	singleQuote: false,
	trailingComma: "all",
	printWidth: 80,
};
