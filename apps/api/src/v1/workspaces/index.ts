import { Hono } from "hono";
import { prisma } from "@bridgeops/database";
import { AppError } from "../../errors/appError.js";
import { ERROR_CODES } from "../../errors/errorCodes.js";
import type { AppEnv } from "../../app.js";

const workspaces = new Hono<AppEnv>()
    .get("/", async (c) => {
        try {
            const userId = c.get('userId');
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
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            
            return c.json({ workspaces });
        } catch (error) {
            throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch workspaces');
        }
    })
    .post("/", (c) => {
        return c.json({ message: "Create a new workspace" });
    })
    .get("/:id", (c) => {
        const { id } = c.req.param();
        return c.json({ message: `Get workspace with ID: ${id}` });
    })
    .put("/:id", (c) => {
        const { id } = c.req.param();
        return c.json({ message: `Update workspace with ID: ${id}` });
    })
    .delete("/:id", (c) => {
        const { id } = c.req.param();
        return c.json({ message: `Delete workspace with ID: ${id}` });
    });

export default workspaces;