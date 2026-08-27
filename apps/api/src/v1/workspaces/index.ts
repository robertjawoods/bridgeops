import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	createWorkspaceSchema,
	workspaceResponseSchema,
	errorSchema,
	validationErrorSchema,
	getWorkspacesResponseSchema,
} from "./schemas.js";
import type { AppEnv } from "../../app.js";
import { AppError } from "../../errors/appError.js";
import { ERROR_CODES } from "../../errors/errorCodes.js";
import { workspaceAuthorisation } from "../../middleware/workspaceAuthorisation.js";
import { WorkspaceService } from "../../services/workspaces/index.js";

const createWorkspaceRoute = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: {
				"application/json": {
					schema: createWorkspaceSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Workspace created",
			content: {
				"application/json": {
					schema: workspaceResponseSchema,
				},
			},
		},

		400: {
			description: "Validation failed",
			content: {
				"application/json": {
					schema: validationErrorSchema,
				},
			},
		},

		409: {
			description: "Workspace slug already exists",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

const getWorkspacesRoute = createRoute({
	method: "get",
	path: "/",
	responses: {
		200: {
			description: "List of workspaces",
			content: {
				"application/json": {
					schema: getWorkspacesResponseSchema,
				},
			},
		},
	},
});

/**
 * `workspaceAuthorisation` is attached here rather than mounted app-wide: mounting it at
 * '/api/v1/workspaces/:slug/*' also captured static siblings like '/switch', because
 * Hono's trailing `*` matches the empty segment. Declaring it on the route keeps its
 * scope to exactly the routes that are workspace-scoped.
 *
 * It answers before the handler, so a non-member and an unknown slug both get 403 —
 * neither discloses whether the workspace exists. It also leaves the resolved workspace
 * on the context, which is what the handler returns.
 */
const getWorkspaceBySlugRoute = createRoute({
	method: "get",
	path: "/{slug}",
	middleware: [workspaceAuthorisation] as const,
	request: {
		params: z.object({
			slug: z.string(),
		}),
	},
	responses: {
		200: {
			description: "Workspace details",
			content: {
				"application/json": {
					schema: workspaceResponseSchema,
				},
			},
		},

		403: {
			description: "Workspace not found, or the user is not a member of it",
			content: {
				"application/json": {
					schema: errorSchema,
				},
			},
		},
	},
});

const switchWorkspaceRoute = createRoute({
	method: "post",
	path: "/switch",
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						slug: z.string(),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: "Workspace switched",
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
		},
	},
});

const { getWorkspaces, createWorkspace, switchWorkspace } =
	new WorkspaceService();

const workspaces = new OpenAPIHono<AppEnv>()
	.openapi(getWorkspacesRoute, async (ctx) => {
		const userId = ctx.get("userId");

		if (!userId) {
			throw new AppError(
				ERROR_CODES.UNAUTHENTICATED,
				"User ID not found in request context",
			);
		}

		const workspaces = await getWorkspaces(userId);

		return ctx.json({ workspaces });
	})
	.openapi(createWorkspaceRoute, async (ctx) => {
		const { name, slug } = ctx.req.valid("json");

		const userId = ctx.get("userId");

		if (!userId) {
			throw new AppError(
				ERROR_CODES.UNAUTHENTICATED,
				"User ID not found in request context",
			);
		}

		const workspace = await createWorkspace(userId, name, slug);

		return ctx.json({ workspace }, 201);
	})
	// Registered ahead of '/{slug}': Hono's RegExpRouter resolves by registration order,
	// so a later `POST /{slug}` would otherwise shadow this static path.
	.openapi(switchWorkspaceRoute, async (ctx) => {
		const { slug } = ctx.req.valid("json");

		const userId = ctx.get("userId");

		if (!userId) {
			throw new AppError(
				ERROR_CODES.UNAUTHENTICATED,
				"User ID not found in request context",
			);
		}

		await switchWorkspace(userId, slug);

		return ctx.json({ message: `Switched to workspace with slug: ${slug}` });
	})
	.openapi(getWorkspaceBySlugRoute, (ctx) =>
		// `workspaceAuthorisation` looked this up by the `:slug` path param, scoped to
		// the caller's memberships — any workspace they belong to, not just their active
		// one. Re-querying by slug here would repeat that exact query.
		ctx.json({ workspace: ctx.get("workspace") }, 200),
	);

// .put("/:slug", async (ctx) => {
//     const { slug } = ctx.req.param();
//     return ctx.json({ message: `Update workspace with slug: ${slug}` });
// })
// .delete("/:slug", async (ctx) => {
//     const { slug } = ctx.req.param();
//     return ctx.json({ message: `Delete workspace with slug: ${slug}` });
// });

export default workspaces;
