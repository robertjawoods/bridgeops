import { afterAll, beforeAll, beforeEach, inject } from "vitest";

/**
 * Per-file setup.
 *
 * Setup files run to completion before the test module is imported, which is what makes
 * the ordering here safe: `@bridgeops/database` builds its Prisma client from
 * `ENV.DATABASE_URL` at *import* time, so the connection string has to be in
 * `process.env` (which the aliased `varlock/env` stub reads) before anything imports it.
 * Hence the dynamic imports below — a static import would be hoisted above the
 * assignment.
 */
process.env.DATABASE_URL = inject("databaseUrl");

const { startJwksServer, setActiveJwksServer } =
	await import("./helpers/auth.js");
const { resetDatabase, disconnectDatabase } = await import("./helpers/db.js");

let jwksServer: Awaited<ReturnType<typeof startJwksServer>> | undefined;

beforeAll(async () => {
	jwksServer = await startJwksServer();
	setActiveJwksServer(jwksServer);

	// `requireAuth` reads both at request time, so setting them here is early enough.
	process.env.APP_URL = jwksServer.origin;
	process.env.APP_INTERNAL_URL = jwksServer.origin;
});

beforeEach(async () => {
	await resetDatabase();
});

afterAll(async () => {
	setActiveJwksServer(undefined);
	await jwksServer?.close();
	await disconnectDatabase();
});
