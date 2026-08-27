import { prisma } from "@bridgeops/database";

export { prisma };

/**
 * Wipe every application table between tests.
 *
 * Discovered from `pg_tables` rather than hardcoded so new models are covered without
 * touching this file. `_prisma_migrations` is preserved — migrations run once per suite
 * in globalSetup, and dropping that table would make Prisma think the DB is unmigrated.
 */
export const resetDatabase = async () => {
	const tables = await prisma.$queryRaw<{ tablename: string }[]>`
		SELECT tablename FROM pg_tables
		WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
	`;

	if (tables.length === 0) return;

	const quoted = tables.map(({ tablename }) => `"public"."${tablename}"`).join(", ");

	await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
};

export const disconnectDatabase = () => prisma.$disconnect();
