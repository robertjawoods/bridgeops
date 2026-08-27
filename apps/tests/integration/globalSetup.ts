import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Client } from "pg";
import type { GlobalSetupContext } from "vitest/node";

declare module "vitest" {
	interface ProvidedContext {
		databaseUrl: string;
	}
}

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const databasePackage = path.join(repoRoot, "packages", "database");
const prismaBin = path.join(databasePackage, "node_modules", ".bin", "prisma");

/** Tables the migrations must have created, as a smoke test that they hit the container. */
const EXPECTED_TABLES = ["user", "Workspace", "Membership"];

let container: StartedPostgreSqlContainer | undefined;

/**
 * Guard against `prisma migrate deploy` ever running against a real database.
 *
 * The Prisma CLI loads packages/database/prisma.config.ts, which pulls its datasource
 * URL from varlock (and therefore potentially Infisical/Railway). We inject
 * DATABASE_URL to override it, but a varlock change could silently flip that
 * precedence — and `migrate deploy` against production would be unrecoverable.
 */
const assertThrowawayDatabase = (url: string) => {
	const { hostname, pathname } = new URL(url);
	const isLocal = ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname);

	if (!isLocal || !pathname.includes("test")) {
		throw new Error(
			`Refusing to run migrations against ${hostname}${pathname}: ` +
				"the integration suite only migrates a local throwaway test database.",
		);
	}
};

/** Verify the migrations actually landed in the container, not somewhere else. */
const assertSchemaApplied = async (databaseUrl: string) => {
	const client = new Client({ connectionString: databaseUrl });
	await client.connect();

	try {
		const { rows } = await client.query<{ tablename: string }>(
			"SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
		);
		const present = new Set(rows.map((row) => row.tablename));
		const missing = EXPECTED_TABLES.filter((table) => !present.has(table));

		if (missing.length > 0) {
			throw new Error(
				`Migrations did not apply to the test container. Missing tables: ${missing.join(", ")}. ` +
					`Found: ${[...present].join(", ") || "(none)"}`,
			);
		}
	} finally {
		await client.end();
	}
};

export async function setup({ provide }: GlobalSetupContext) {
	container = await new PostgreSqlContainer("postgres:17-alpine")
		.withDatabase("bridgeops_test")
		.withUsername("bridgeops")
		.withPassword("bridgeops")
		.start();

	const databaseUrl = container.getConnectionUri();

	assertThrowawayDatabase(databaseUrl);

	try {
		execFileSync(prismaBin, ["migrate", "deploy"], {
			cwd: databasePackage,
			env: { ...process.env, DATABASE_URL: databaseUrl },
			stdio: "pipe",
		});
	} catch (error) {
		const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
		throw new Error(
			`prisma migrate deploy failed:\n${stdout?.toString() ?? ""}\n${stderr?.toString() ?? ""}`,
		);
	}

	await assertSchemaApplied(databaseUrl);

	provide("databaseUrl", databaseUrl);
}

export async function teardown() {
	await container?.stop();
}
