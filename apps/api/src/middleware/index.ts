import type { Hono } from "hono";
import type pino from "pino";
import type { AppEnv } from "../app.js";
import { structuredLogger } from "@hono/structured-logger";
import { requestId } from "hono/request-id";
import { requireAuth } from "./requireAuth.js";
import { workspaceAuthorisation } from "./workspaceAuthorisation.js";

export const setupMiddleware = (app: Hono<AppEnv>, rootLogger: pino.Logger) => {
    app
        .use(requestId())
        .use('*', async (c, next) => {
            c.set(
                'logger',
                rootLogger.child({
                    requestId: c.var.requestId
                })
            )

            await next()
        })
        .use('/api/*', requireAuth)
        .use('/api/v1/workspaces/:slug/*', workspaceAuthorisation)

        .use(structuredLogger({
            createLogger: (c) => c.get('logger')
        }))
}