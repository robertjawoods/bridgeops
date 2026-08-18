import { prisma } from "@bridgeops/database"
import { Hono } from "hono"
import pino from "pino"
import { handle } from "./errors/handle.js"
import v1 from "./v1/index.js"

import { setupMiddleware } from "./middleware/index.js"
export type AppEnv = {
    Variables: {
        requestId: string;
        logger: pino.Logger;
    };
};


export const createApp = ({ rootLogger }: { rootLogger: pino.Logger }) => {
    const app = new Hono<AppEnv>()

    setupMiddleware(app, rootLogger)

    app.onError(handle)

    app.get('/', (c) => {
        return c.text('Hello BridgeOps!')
    })

    app.get('/healthz', (c) => {
        return c.text("alive")
    })

    app.get('/ready', async (c) => {
        await prisma.$queryRaw`SELECT 1`;

        return c.text('ready');
    })

    const routes = app.route('/api', v1);

    return { app, routes };
}
