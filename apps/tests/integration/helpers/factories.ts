import type { MembershipRole } from "@bridgeops/database";
import { prisma } from "@bridgeops/database";

/**
 * Fixture builders for integration tests. Every field has a unique default so suites can
 * create records without coordinating on names, emails, or slugs.
 */

let counter = 0;
const unique = (prefix: string) =>
	`${prefix}-${Date.now().toString(36)}-${++counter}`;

export const createUser = (
	overrides: { email?: string; name?: string; username?: string } = {},
) =>
	prisma.user.create({
		data: {
			email: overrides.email ?? `${unique("user")}@example.test`,
			name: overrides.name ?? "Test User",
			username: overrides.username ?? unique("username"),
		},
	});

export const createWorkspace = (
	overrides: { name?: string; slug?: string } = {},
) =>
	prisma.workspace.create({
		data: {
			name: overrides.name ?? "Test Workspace",
			slug: overrides.slug ?? unique("workspace"),
		},
	});

export const addMember = (
	userId: string,
	workspaceId: string,
	role: MembershipRole = "OWNER",
) => prisma.membership.create({ data: { userId, workspaceId, role } });

/** A workspace the given user is a member of — the common setup for authorised requests. */
export const createWorkspaceForUser = async (
	userId: string,
	overrides: { name?: string; slug?: string; role?: MembershipRole } = {},
) => {
	const workspace = await createWorkspace(overrides);
	await addMember(userId, workspace.id, overrides.role ?? "OWNER");

	return workspace;
};

/** A user plus a workspace they own — the most common two-line setup. */
export const createUserWithWorkspace = async (
	overrides: { slug?: string; role?: MembershipRole } = {},
) => {
	const user = await createUser();
	const workspace = await createWorkspaceForUser(user.id, overrides);

	return { user, workspace };
};
