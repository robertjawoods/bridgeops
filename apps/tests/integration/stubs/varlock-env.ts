/**
 * Test stub for `varlock/env`.
 *
 * The real `ENV` is resolved by varlock from `.env.schema` files plus Infisical, and
 * it deliberately ignores `process.env` — setting `DATABASE_URL` in the shell does NOT
 * reach `ENV.DATABASE_URL`. That makes it impossible to point the app at a throwaway
 * test database. This stub is aliased over `varlock/env` for the test projects (see
 * vitest.config.ts) so `ENV` reads live from `process.env` instead.
 *
 * The Proxy reads on every access rather than snapshotting, so values set after import
 * (e.g. the JWKS server origin, which is only known once the server binds a port) are
 * still visible to code that reads `ENV` at request time.
 */
export const ENV: Record<string, string | undefined> = new Proxy(
	{},
	{
		get: (_target, key) => (typeof key === "string" ? process.env[key] : undefined),
		has: (_target, key) => typeof key === "string" && key in process.env,
		ownKeys: () => Reflect.ownKeys(process.env),
		getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
	},
);

export default ENV;
