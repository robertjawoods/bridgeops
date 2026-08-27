import { z } from "@hono/zod-openapi";

export const workspaceSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	plan: z.any(),
	createdAt: z.string(),
	updatedAt: z.string(),
	deletedAt: z.string().nullable(),
});

export const createWorkspaceSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.max(100, "Name must be at most 100 characters"),

	slug: z
		.string()
		.trim()
		.min(1, "Slug is required")
		.max(50, "Slug must be at most 50 characters")
		.regex(
			/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
			"Slug must be lowercase alphanumeric and can include hyphens",
		),
});

export const workspaceResponseSchema = z.object({
    workspace: workspaceSchema,
});


export const getWorkspacesResponseSchema = z.object({
    workspaces: z.array(workspaceSchema),
});

export const errorSchema = z.object({
	error: z.string(),
});

/**
 * Shape produced by `@hono/zod-openapi`'s default validation hook.
 *
 * The hook returns this response itself rather than throwing, so `handleError` never
 * sees the ZodError and cannot reshape it. `error.message` is the Zod issue array
 * serialised as a JSON string — parse it to read `path` and `message` per issue.
 */
export const validationErrorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		name: z.literal("ZodError"),
		message: z.string(),
	}),
});