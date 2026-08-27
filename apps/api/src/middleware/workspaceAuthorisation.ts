import { createMiddleware } from "hono/factory";
import { AppError } from "../errors/appError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { prisma } from "@bridgeops/database";
import type { AppEnv } from "../app.js";

// Typed with AppEnv so the vars this sets are checked here, and so routes that attach it
// via `createRoute({ middleware: [...] })` keep a typed `ctx` instead of widening to any.
export const workspaceAuthorisation = createMiddleware<AppEnv>(
	async (c, next) => {
		const userId = c.get("userId");
		const slug = c.req.param("slug");

		if (!userId || !slug) {
			throw new AppError(ERROR_CODES.FORBIDDEN, "Forbidden");
		}

		const row = await prisma.workspace.findFirst({
			where: {
				memberships: {
					some: {
						userId: userId,
					},
				},
				slug,
			},
			include: {
				memberships: {
					where: {
						userId: userId,
					},
					select: {
						id: true,
						role: true,
					},
				},
			},
		});

		if (!row) {
			throw new AppError(ERROR_CODES.FORBIDDEN, "Forbidden");
		}

		const membership = row.memberships.at(0);

		if (!membership) {
			throw new AppError(ERROR_CODES.FORBIDDEN, "Forbidden");
		}

		// Split the joined memberships off the workspace row: handlers serialise
		// `workspace` straight into the response body, and the membership rows must not
		// ride along with it.
		const { memberships: _memberships, ...workspace } = row;

		c.set("workspace", workspace);
		c.set("workspaceId", workspace.id);
		c.set("workspaceMembership", membership);
		c.set("workspaceRole", membership.role);

		await next();
	},
);
