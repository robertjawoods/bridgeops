import type { Hono } from "hono";
import type pino from "pino";
import type { AppEnv } from "../app.js";
import { structuredLogger } from "@hono/structured-logger";
import { requestId } from "hono/request-id";
import { requireAuth } from "./requireAuth.js";

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
        // `workspaceAuthorisation` is deliberately NOT registered here. Mounted at
        // '/api/v1/workspaces/:slug/*' it also matched the bare '/:slug' path (Hono's
        // trailing `*` matches the empty segment) and swallowed static siblings such as
        // '/workspaces/switch' as `slug = "switch"`. Routes that need a workspace scope
        // now declare it themselves via `createRoute({ middleware: [...] })`.
        .use('/api/*', requireAuth)
        .use(structuredLogger({
            createLogger: (c) => c.get('logger')
        }))
}