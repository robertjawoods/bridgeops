import { AppError } from "../../errors/appError.js";
import { ERROR_CODES } from "../../errors/errorCodes.js";
import { prisma } from "@bridgeops/database";

export class WorkspaceService {
	async getWorkspaces(userId: string) {
		if (!userId) {
			throw new AppError(
				ERROR_CODES.UNAUTHENTICATED,
				"User ID not found in request context",
			);
		}

		const workspaces = await prisma.workspace.findMany({
			where: {
				memberships: {
					some: {
						userId: userId,
					},
				},
			},
		});

		return workspaces;
	}

	async createWorkspace(userId: string, name: string, slug: string) {
		if (!userId) {
			throw new AppError(
				ERROR_CODES.UNAUTHENTICATED,
				"User ID not found in request context",
			);
		}

		// slug must be unique, check if it already exists
		const existingWorkspace = await prisma.workspace.findUnique({
			select: {
				id: true,
			},
			where: {
				slug: slug,
			},
		});

		if (existingWorkspace) {
			throw new AppError(
				ERROR_CODES.CONFLICT,
				"Workspace with this slug already exists",
			);
		}

		const workspace = await prisma.workspace.create({
			data: {
				name,
				slug,
				memberships: {
					create: {
						userId: userId,
						role: "OWNER",
					},
				},
			},
		});

		return workspace;
	}

	async switchWorkspace(userId: string, slug: string) {
		if (!userId) {
			throw new AppError(
				ERROR_CODES.UNAUTHENTICATED,
				"User ID not found in request context",
			);
		}

		const workspace = await prisma.workspace.findFirst({
			select: {
				id: true,
				slug: true,
			},
			where: {
				slug: slug,
				memberships: {
					some: {
						userId: userId,
					},
				},
			},
		});

		if (!workspace) {
			throw new AppError(ERROR_CODES.NOT_FOUND, "Workspace not found");
		}

		const updated = await prisma.user.update({
			select: {
				id: true,
			},
			where: {
				id: userId,
			},
			data: {
				activeWorkspaceId: workspace?.id || null,
			},
		});

		if (!updated) {
			throw new AppError(
				ERROR_CODES.INTERNAL_ERROR,
				"Failed to switch workspace",
			);
		}

		return workspace;
	}
}
