import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { AppEnv } from "../../api/src/app.js";
import { handleError } from "../../api/src/middleware/handleError.js";
import { workspaceAuthorisation } from "../../api/src/middleware/workspaceAuthorisation.js";
import {
	createUser,
	createUserWithWorkspace,
	createWorkspace,
	createWorkspaceForUser,
} from "./helpers/factories.js";

/**
 * `workspaceAuthorisation` populates the workspace context vars. In the real app it is
 * attached per-route via `createRoute({ middleware: [...] })` behind `requireAuth` — it
 * is deliberately NOT mounted app-wide, see the note in `middleware/index.ts`. This
 * harness mounts it directly with a stubbed `userId`, which is what `requireAuth` would
 * otherwise have set.
 */
const buildHarness = (userId?: string) => {
	const app = new Hono<AppEnv>({ strict: true });

	app.onError(handleError);

	app.use("/workspaces/:slug/*", async (ctx, next) => {
		if (userId !== undefined) ctx.set("userId", userId);
		await next();
	});

	app.use("/workspaces/:slug/*", workspaceAuthorisation);

	app.get("/workspaces/:slug/probe", (ctx) =>
		ctx.json({
			workspace: ctx.get("workspace"),
			workspaceId: ctx.get("workspaceId"),
			workspaceRole: ctx.get("workspaceRole"),
			membershipId: ctx.get("workspaceMembership")?.id,
		}),
	);

	return app;
};

describe("workspaceAuthorisation", () => {
	it("populates the workspace context for a member", async () => {
		const { user, workspace } = await createUserWithWorkspace({
			slug: "platform",
		});

		const response = await buildHarness(user.id).request(
			"/workspaces/platform/probe",
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			workspaceId: workspace.id,
			workspaceRole: "OWNER",
			membershipId: expect.any(String),
		});
	});

	it("exposes the full workspace row without the joined memberships", async () => {
		const { user, workspace } = await createUserWithWorkspace({
			slug: "platform",
		});

		const response = await buildHarness(user.id).request(
			"/workspaces/platform/probe",
		);
		const body = (await response.json()) as {
			workspace: Record<string, unknown>;
		};

		expect(body.workspace).toMatchObject({
			id: workspace.id,
			slug: "platform",
			name: "Test Workspace",
			plan: "FREE",
			deletedAt: null,
		});
		// The membership rows are joined in to authorise the request; handlers serialise
		// `workspace` straight into the response body, so they must not ride along.
		expect(body.workspace).not.toHaveProperty("memberships");
	});

	it.each(["OWNER", "ADMIN", "DEVELOPER", "VIEWER"] as const)(
		"exposes the %s role",
		async (role) => {
			const user = await createUser();
			await createWorkspaceForUser(user.id, { slug: "platform", role });

			const response = await buildHarness(user.id).request(
				"/workspaces/platform/probe",
			);

			expect(await response.json()).toMatchObject({ workspaceRole: role });
		},
	);

	it("resolves the membership of the requesting user, not another member", async () => {
		const owner = await createUser();
		const viewer = await createUser();
		const workspace = await createWorkspaceForUser(owner.id, {
			slug: "platform",
		});
		await createWorkspaceForUser(viewer.id, { slug: "ignored" });
		await import("./helpers/db.js").then(({ prisma }) =>
			prisma.membership.create({
				data: { userId: viewer.id, workspaceId: workspace.id, role: "VIEWER" },
			}),
		);

		const response = await buildHarness(viewer.id).request(
			"/workspaces/platform/probe",
		);

		expect(await response.json()).toMatchObject({
			workspaceId: workspace.id,
			workspaceRole: "VIEWER",
		});
	});

	describe("rejects with 403", () => {
		it("when there is no userId in context", async () => {
			await createWorkspace({ slug: "platform" });

			const response = await buildHarness(undefined).request(
				"/workspaces/platform/probe",
			);

			expect(response.status).toBe(403);
			expect(await response.json()).toEqual({ error: "Forbidden" });
		});

		it("when the user is not a member of an existing workspace", async () => {
			const outsider = await createUser();
			await createWorkspace({ slug: "platform" });

			const response = await buildHarness(outsider.id).request(
				"/workspaces/platform/probe",
			);

			expect(response.status).toBe(403);
		});

		it("when the slug does not exist", async () => {
			const user = await createUser();

			const response = await buildHarness(user.id).request(
				"/workspaces/nope/probe",
			);

			expect(response.status).toBe(403);
		});

		it("without disclosing whether the workspace exists", async () => {
			const user = await createUser();
			await createWorkspace({ slug: "real-workspace" });

			const existing = await buildHarness(user.id).request(
				"/workspaces/real-workspace/probe",
			);
			const missing = await buildHarness(user.id).request(
				"/workspaces/no-such-thing/probe",
			);

			expect(existing.status).toBe(missing.status);
			expect(await existing.json()).toEqual(await missing.json());
		});
	});
});
