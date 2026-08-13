import { prisma } from "@bridgeops/database"
import { structuredLogger } from "@hono/structured-logger"
import { Hono } from "hono"
import { requestId } from "hono/request-id"
import pino from "pino"

export const createApp = ({ rootLogger }: { rootLogger: pino.Logger<never, boolean> }) => {
    const app = new Hono()

    app.use(requestId())
    app.use(structuredLogger({
        createLogger: (c) => rootLogger.child({ requestId: c.var.requestId })
    }))

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

    return app;
}
