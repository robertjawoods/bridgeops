import "varlock/auto-load";
import { prisma } from "../src/client.js";

/**
 * Local development seed.
 *
 * Idempotent — safe to re-run against an existing dev database. This is for hand-driving
 * the app locally; integration tests build their own fixtures via
 * apps/tests/integration/helpers/factories.ts against a throwaway container.
 */

const SEED_USER_EMAIL = "dev@bridgeops.local";
const SEED_WORKSPACE_SLUG = "acme";

const seed = async () => {
	const user = await prisma.user.upsert({
		where: { email: SEED_USER_EMAIL },
		update: {},
		create: {
			email: SEED_USER_EMAIL,
			name: "Dev User",
			username: "dev",
			emailVerified: true,
		},
	});

	const workspace = await prisma.workspace.upsert({
		where: { slug: SEED_WORKSPACE_SLUG },
		update: {},
		create: { name: "Acme", slug: SEED_WORKSPACE_SLUG },
	});

	await prisma.membership.upsert({
		where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
		update: {},
		create: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
	});

	await prisma.user.update({
		where: { id: user.id },
		data: { activeWorkspaceId: workspace.id },
	});

	console.log(`Seeded ${user.email} as OWNER of "${workspace.name}" (/${workspace.slug})`);
};

seed()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
