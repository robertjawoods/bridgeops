import { Hono } from "hono";
import { prisma } from "@bridgeops/database";

const workspaces = new Hono()
    .get("/", async (c) => {
        const workspaces = await prisma.workspace.findMany();

        return c.json({ workspaces });
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