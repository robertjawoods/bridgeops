import { describe, expect, it } from "vitest";
import { validationErrorSchema } from "../../api/src/v1/workspaces/schemas.js";
import { buildTestApp, request } from "./helpers/app.js";
import { prisma } from "./helpers/db.js";
import {
	createUser,
	createUserWithWorkspace,
	createWorkspace,
	createWorkspaceForUser,
} from "./helpers/factories.js";

/**
 * Read the issues out of a validation failure.
 *
 * `@hono/zod-openapi` handles request-validation failures with its own default hook,
 * which returns `{ success: false, error: { name: "ZodError", message: "..." } }` where
 * `message` is the Zod issue array serialised as a JSON string. See the "validation
 * error contract" block at the bottom of this file.
 */
const validationIssues = async (response: Response) => {
	const body = (await response.json()) as {
		success: boolean;
		error: { name: string; message: string };
	};

	return JSON.parse(body.error.message) as { path: string[]; message: string }[];
};

describe("GET /api/v1/workspaces", () => {
	it("returns an empty list for a user with no memberships", async () => {
		const user = await createUser();

		const response = await request(buildTestApp(), "/api/v1/workspaces", { as: user.id });

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ workspaces: [] });
	});

	it("returns every workspace the user is a member of", async () => {
		const user = await createUser();
		await createWorkspaceForUser(user.id, { slug: "first" });
		await createWorkspaceForUser(user.id, { slug: "second" });

		const response = await request(buildTestApp(), "/api/v1/workspaces", { as: user.id });
		const body = (await response.json()) as { workspaces: { slug: string }[] };

		expect(response.status).toBe(200);
		expect(body.workspaces.map((workspace) => workspace.slug).sort()).toEqual([
			"first",
			"second",
		]);
	});

	it("excludes workspaces the user is not a member of", async () => {
		const user = await createUser();
		await createWorkspaceForUser(user.id, { slug: "mine" });
		await createWorkspace({ slug: "someone-elses" });

		const response = await request(buildTestApp(), "/api/v1/workspaces", { as: user.id });
		const body = (await response.json()) as { workspaces: { slug: string }[] };

		expect(body.workspaces.map((workspace) => workspace.slug)).toEqual(["mine"]);
	});

	it("serialises the workspace shape the OpenAPI schema advertises", async () => {
		const { user } = await createUserWithWorkspace({ slug: "shaped" });

		const response = await request(buildTestApp(), "/api/v1/workspaces", { as: user.id });
		const body = (await response.json()) as { workspaces: Record<string, unknown>[] };

		expect(body.workspaces[0]).toMatchObject({
			slug: "shaped",
			name: "Test Workspace",
			plan: "FREE",
			deletedAt: null,
		});
		// Prisma returns Date objects; ctx.json serialises them to ISO strings, which is
		// why workspaceSchema can declare these as z.string().
		expect(body.workspaces[0]?.createdAt).toEqual(expect.any(String));
		expect(body.workspaces[0]?.updatedAt).toEqual(expect.any(String));
	});

	it("404s on the trailing-slash form because the app is in strict mode", async () => {
		const user = await createUser();

		const response = await request(buildTestApp(), "/api/v1/workspaces/", { as: user.id });

		expect(response.status).toBe(404);
	});
});

describe("POST /api/v1/workspaces", () => {
	it("creates a workspace and returns it", async () => {
		const user = await createUser();

		const response = await request(buildTestApp(), "/api/v1/workspaces", {
			method: "POST",
			as: user.id,
			json: { name: "Platform", slug: "platform" },
		});

		expect(response.status).toBe(201);
		expect(await response.json()).toMatchObject({
			workspace: { name: "Platform", slug: "platform", plan: "FREE" },
		});
	});

	it("makes the creator an OWNER", async () => {
		const user = await createUser();

		await request(buildTestApp(), "/api/v1/workspaces", {
			method: "POST",
			as: user.id,
			json: { name: "Platform", slug: "platform" },
		});

		const membership = await prisma.membership.findFirst({
			where: { userId: user.id },
			include: { workspace: true },
		});

		expect(membership).toMatchObject({ role: "OWNER" });
		expect(membership?.workspace.slug).toBe("platform");
	});

	it("trims surrounding whitespace", async () => {
		const user = await createUser();

		const response = await request(buildTestApp(), "/api/v1/workspaces", {
			method: "POST",
			as: user.id,
			json: { name: "  Platform  ", slug: "  platform  " },
		});

		expect(await response.json()).toMatchObject({
			workspace: { name: "Platform", slug: "platform" },
		});
	});

	it("rejects a duplicate slug with 409", async () => {
		const user = await createUser();
		await createWorkspace({ slug: "taken" });

		const response = await request(buildTestApp(), "/api/v1/workspaces", {
			method: "POST",
			as: user.id,
			json: { name: "Platform", slug: "taken" },
		});

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			error: "Workspace with this slug already exists",
		});
	});

	it("requires authentication", async () => {
		const response = await request(buildTestApp(), "/api/v1/workspaces", {
			method: "POST",
			json: { name: "Platform", slug: "platform" },
		});

		expect(response.status).toBe(401);
	});

	describe("validation", () => {
		it.each([
			["an empty name", { name: "", slug: "platform" }, "name"],
			["a whitespace-only name", { name: "   ", slug: "platform" }, "name"],
			["a name over 100 characters", { name: "a".repeat(101), slug: "platform" }, "name"],
			["an empty slug", { name: "Platform", slug: "" }, "slug"],
			["a slug over 50 characters", { name: "Platform", slug: "a".repeat(51) }, "slug"],
			["an uppercase slug", { name: "Platform", slug: "Platform" }, "slug"],
			["a slug with underscores", { name: "Platform", slug: "bad_slug" }, "slug"],
			["a slug with a trailing hyphen", { name: "Platform", slug: "platform-" }, "slug"],
			["a missing name", { slug: "platform" }, "name"],
			["a missing slug", { name: "Platform" }, "slug"],
		])("rejects %s", async (_label, json, expectedField) => {
			const user = await createUser();

			const response = await request(buildTestApp(), "/api/v1/workspaces", {
				method: "POST",
				as: user.id,
				json,
			});

			expect(response.status).toBe(400);

			const issues = await validationIssues(response);

			expect(issues.map((issue) => issue.path.join("."))).toContain(expectedField);
		});

		it("does not persist a workspace when validation fails", async () => {
			const user = await createUser();

			await request(buildTestApp(), "/api/v1/workspaces", {
				method: "POST",
				as: user.id,
				json: { name: "", slug: "bad_slug" },
			});

			expect(await prisma.workspace.count()).toBe(0);
		});

		it("reports every failing field at once", async () => {
			const user = await createUser();

			const response = await request(buildTestApp(), "/api/v1/workspaces", {
				method: "POST",
				as: user.id,
				json: { name: "", slug: "bad_slug" },
			});

			const issues = await validationIssues(response);

			expect(issues.map((issue) => issue.path.join("."))).toEqual(["name", "slug"]);
		});
	});
});

describe("GET /api/v1/workspaces/:slug", () => {
	it("returns a workspace the user belongs to", async () => {
		const { user } = await createUserWithWorkspace({ slug: "platform" });

		const response = await request(buildTestApp(), "/api/v1/workspaces/platform", {
			as: user.id,
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ workspace: { slug: "platform" } });
	});

	// This route attaches `workspaceAuthorisation` via `createRoute({ middleware })`, so
	// the guard answers before the handler: a non-member and an unknown slug are both
	// 403, and neither discloses whether the workspace exists.
	// The lookup is by slug and scoped to the caller's memberships — `activeWorkspaceId`
	// plays no part in it. Any workspace the user belongs to is reachable by slug,
	// whether or not it is the one they last switched to.
	it("returns a non-active workspace the user belongs to", async () => {
		const user = await createUser();
		const active = await createWorkspaceForUser(user.id, { slug: "active-one" });
		await createWorkspaceForUser(user.id, { slug: "other-one" });

		await prisma.user.update({
			where: { id: user.id },
			data: { activeWorkspaceId: active.id },
		});

		const response = await request(buildTestApp(), "/api/v1/workspaces/other-one", {
			as: user.id,
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ workspace: { slug: "other-one" } });
	});

	it("403s for a workspace the user is not a member of", async () => {
		const outsider = await createUser();
		await createWorkspace({ slug: "private-workspace" });

		const response = await request(buildTestApp(), "/api/v1/workspaces/private-workspace", {
			as: outsider.id,
		});

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: "Forbidden" });
	});

	it("403s for an unknown slug", async () => {
		const user = await createUser();

		const response = await request(buildTestApp(), "/api/v1/workspaces/nope", { as: user.id });

		expect(response.status).toBe(403);
	});

	it("requires authentication", async () => {
		const response = await request(buildTestApp(), "/api/v1/workspaces/platform");

		expect(response.status).toBe(401);
	});
});

describe("POST /api/v1/workspaces/switch", () => {
	it("sets the user's active workspace", async () => {
		const { user, workspace } = await createUserWithWorkspace({ slug: "platform" });

		const response = await request(buildTestApp(), "/api/v1/workspaces/switch", {
			method: "POST",
			as: user.id,
			json: { slug: "platform" },
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			message: "Switched to workspace with slug: platform",
		});

		const updated = await prisma.user.findUnique({ where: { id: user.id } });

		expect(updated?.activeWorkspaceId).toBe(workspace.id);
	});

	it("switches between two workspaces the user belongs to", async () => {
		const user = await createUser();
		await createWorkspaceForUser(user.id, { slug: "first" });
		const second = await createWorkspaceForUser(user.id, { slug: "second" });

		const app = buildTestApp();

		await request(app, "/api/v1/workspaces/switch", {
			method: "POST",
			as: user.id,
			json: { slug: "first" },
		});
		await request(app, "/api/v1/workspaces/switch", {
			method: "POST",
			as: user.id,
			json: { slug: "second" },
		});

		const updated = await prisma.user.findUnique({ where: { id: user.id } });

		expect(updated?.activeWorkspaceId).toBe(second.id);
	});

	/**
	 * Regression guard for BRI-191.
	 *
	 * `workspaceAuthorisation` used to be mounted app-wide at
	 * `/api/v1/workspaces/:slug/*`. Hono's trailing `*` matches the empty segment, so
	 * that pattern also captured this static path as `slug = "switch"` — no workspace
	 * has that slug, so every request 403d before the handler ran. The guard is now
	 * declared per-route, and this path carries none.
	 *
	 * A 403 here means the app-wide registration is back.
	 */
	it("is not intercepted by the workspace guard", async () => {
		const { user } = await createUserWithWorkspace({ slug: "platform" });

		const response = await request(buildTestApp(), "/api/v1/workspaces/switch", {
			method: "POST",
			as: user.id,
			json: { slug: "platform" },
		});

		expect(response.status).not.toBe(403);
	});

	it("404s for an unknown slug", async () => {
		const user = await createUser();

		const response = await request(buildTestApp(), "/api/v1/workspaces/switch", {
			method: "POST",
			as: user.id,
			json: { slug: "no-such-workspace" },
		});

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: "Workspace not found" });
	});

	// The switch route is registered ahead of `/{slug}` because Hono's RegExpRouter
	// resolves by registration order. A workspace genuinely slugged "switch" must not
	// change which handler this path reaches.
	it("still routes to the switch handler when a workspace is slugged 'switch'", async () => {
		const user = await createUser();
		await createWorkspaceForUser(user.id, { slug: "switch" });
		const target = await createWorkspaceForUser(user.id, { slug: "platform" });

		const response = await request(buildTestApp(), "/api/v1/workspaces/switch", {
			method: "POST",
			as: user.id,
			json: { slug: "platform" },
		});

		expect(response.status).toBe(200);

		const updated = await prisma.user.findUnique({ where: { id: user.id } });

		expect(updated?.activeWorkspaceId).toBe(target.id);
	});

	it("does not switch to a workspace the user is not a member of", async () => {
		const outsider = await createUser();
		await createWorkspace({ slug: "private-workspace" });

		const response = await request(buildTestApp(), "/api/v1/workspaces/switch", {
			method: "POST",
			as: outsider.id,
			json: { slug: "private-workspace" },
		});

		// 404, not 403: the guard does not run here, so the service answers — and it
		// scopes its lookup by membership, so a non-member is indistinguishable from a
		// workspace that does not exist.
		expect(response.status).toBe(404);

		const updated = await prisma.user.findUnique({ where: { id: outsider.id } });

		expect(updated?.activeWorkspaceId).toBeNull();
	});

	it("requires authentication", async () => {
		const response = await request(buildTestApp(), "/api/v1/workspaces/switch", {
			method: "POST",
			json: { slug: "platform" },
		});

		expect(response.status).toBe(401);
	});
});

describe("validation error contract", () => {
	/**
	 * Request validation is owned by `@hono/zod-openapi`'s default hook, which returns
	 * this response itself rather than throwing — so `handleError` never sees the
	 * ZodError. `validationErrorSchema` documents exactly this shape; these tests are
	 * what keep the two in step.
	 */
	it("returns the zod-openapi default hook shape", async () => {
		const user = await createUser();

		const response = await request(buildTestApp(), "/api/v1/workspaces", {
			method: "POST",
			as: user.id,
			json: { name: "", slug: "platform" },
		});

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			success: false,
			error: {
				name: "ZodError",
				message: expect.any(String),
			},
		});
	});

	it("matches the schema the OpenAPI definition advertises", async () => {
		const user = await createUser();

		const response = await request(buildTestApp(), "/api/v1/workspaces", {
			method: "POST",
			as: user.id,
			json: { name: "", slug: "platform" },
		});

		expect(validationErrorSchema.safeParse(await response.json())).toMatchObject({
			success: true,
		});
	});

	it("carries the failing issues as a JSON string in error.message", async () => {
		const user = await createUser();

		const response = await request(buildTestApp(), "/api/v1/workspaces", {
			method: "POST",
			as: user.id,
			json: { name: "", slug: "platform" },
		});

		expect(await validationIssues(response)).toEqual([
			expect.objectContaining({ path: ["name"], message: "Name is required" }),
		]);
	});
});
