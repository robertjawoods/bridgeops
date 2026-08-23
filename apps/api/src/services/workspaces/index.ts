import type { Context } from "hono";
import { AppError } from "../../errors/appError.js";
import { ERROR_CODES } from "../../errors/errorCodes.js";
import { prisma } from "@bridgeops/database";

const getWorkspaces = async (userId: string) => {
    try {
        if (!userId) {
            throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'User ID not found in request context');
        }

        const workspaces = await prisma.workspace.findMany({
            where: {
                memberships: {
                    some: {
                        userId: userId
                    }
                }
            }
        });

        return workspaces;
    } catch (error) {
        throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch workspaces');
    }
}

const createWorkspace = async (userId: string, name: string, slug: string) => {
    if (!userId) {
        throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'User ID not found in request context');
    }

    // slug must be unique, check if it already exists
    const existingWorkspace = await prisma.workspace.findUnique({
        select: {
            id: true
        },
        where: {
            slug: slug
        }
    });

    if (existingWorkspace) {
        throw new AppError(ERROR_CODES.CONFLICT, 'Workspace with this slug already exists');
    }

    const workspace = await prisma.workspace.create({
        data: {
            name,
            slug,
            memberships: {
                create: {
                    userId: userId,
                    role: 'OWNER'
                }
            }
        }
    });

    return workspace;

}


const getWorkspaceBySlug = async (userId: string, slug: string) => {
    try {
        if (!userId) {
            throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'User ID not found in request context');
        }

        const workspace = await prisma.workspace.findFirst({
            where: {
                slug: slug,
                memberships: {
                    some: {
                        userId: userId
                    }
                }
            }
        });

        if (!workspace) {
            throw new AppError(ERROR_CODES.NOT_FOUND, 'Workspace not found');
        }

        return workspace;
    } catch (error) {
        throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch workspace');
    }
}

export { getWorkspaces, createWorkspace, getWorkspaceBySlug };