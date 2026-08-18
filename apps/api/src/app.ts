import { prisma } from "@bridgeops/database"
import { structuredLogger } from "@hono/structured-logger"
import { Hono } from "hono"
import { requestId } from "hono/request-id"
import pino from "pino"
import { handle } from "./errors/handle.js"
import v1 from "./v1/index.js"
import { requireAuth } from "./middleware/requireAuth.js"

export type AppEnv = {
    Variables: {
        requestId: string;
        logger: pino.Logger;
    };
};


export const createApp = ({ rootLogger }: { rootLogger?: pino.Logger }) => {
    const app = new Hono<AppEnv>()

    app.use(requestId())
    app.use('/api/*', requireAuth);

    if (rootLogger) {
        app.use('*', async (c, next) => {
            c.set(
                'logger',
                rootLogger.child({
                    requestId: c.var.requestId
                })
            )

            await next()
        })

        app.use(structuredLogger({
            createLogger: (c) => c.get('logger')
        }))
    }

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

    return {app, routes};
}
