import { prisma } from "@bridgeops/database"
import { Hono } from "hono"
import pino from "pino"
import { handle } from "./errors/handle.js"

import { setupMiddleware } from "./middleware/index.js"
export type AppEnv = {
    Variables: {
        requestId: string;
        logger: pino.Logger;
    };
};


export const createApp = ({
    rootLogger,
    api = new Hono(),
}: {
    rootLogger: pino.Logger;
    api?: Hono;
}) => {
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

    const routes = app.route('/api', api);

    return { app, routes };
}
