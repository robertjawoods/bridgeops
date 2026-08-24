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
import { WorkspaceService} from "../../services/workspaces/index.js";

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
        }
    },
});

const getWorkspaceBySlugRoute = createRoute({
    method: "get",
    path: "/:slug",
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

const { getWorkspaces, createWorkspace, getWorkspaceBySlug, switchWorkspace } = new WorkspaceService();

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
    .openapi(getWorkspaceBySlugRoute, async (ctx) => {
        const { slug } = ctx.req.valid("param");

        const userId = ctx.get("userId");

        const workspace = await getWorkspaceBySlug(userId, slug);

        return ctx.json({ workspace });
    })
    .openapi(switchWorkspaceRoute, async (ctx) => {
        const { slug } = ctx.req.valid("json");

        const userId = ctx.get("userId");

        if (!userId) {
            throw new AppError(
                ERROR_CODES.UNAUTHENTICATED,
                "User ID not found in request context",
            );
        }

        const { slug: switchedSlug } = await switchWorkspace(userId, slug);

        if (!switchedSlug) {
            throw new AppError(
                ERROR_CODES.NOT_FOUND,
                "Workspace not found or user is not a member of the workspace",
            );
        }

        // Implement the logic to switch workspace here
        // For now, just return a success message
        return ctx.json({ message: `Switched to workspace with slug: ${slug}` });
    });



// .put("/:slug", async (ctx) => {
//     const { slug } = ctx.req.param();
//     return ctx.json({ message: `Update workspace with slug: ${slug}` });
// })
// .delete("/:slug", async (ctx) => {
//     const { slug } = ctx.req.param();
//     return ctx.json({ message: `Delete workspace with slug: ${slug}` });
// });

export default workspaces;