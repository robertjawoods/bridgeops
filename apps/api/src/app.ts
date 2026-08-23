import { prisma } from "@bridgeops/database"
import { Hono } from "hono"
import pino from "pino"
import { handle } from "./errors/handle.js"
import { handleError } from "./middleware/handleError.js"

import { setupMiddleware } from "./middleware/index.js"
import z from "zod"
import { AppError } from "./errors/appError.js"
import { ERROR_CODES } from "./errors/errorCodes.js"
export type AppEnv = {
    Variables: {
        userId: string;
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

    app.route('/api', api);

    app.onError(handleError);

    return { app };
}
