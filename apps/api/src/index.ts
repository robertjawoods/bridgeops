import "varlock/auto-load";
import { ENV } from 'varlock/env';
import { serve } from '@hono/node-server'
import pino from 'pino';
import { createApp } from './app.js';
import { createV1 } from './v1/index.js';

const rootLogger = pino({
  transport: {
    target: 'pino-pretty'
  }
})

const { app, routes } = createApp({ rootLogger, api: createV1() });

serve({
  fetch: app.fetch,
  port: ENV.PORT
}, (info) => {
  rootLogger.info({ port: info.port }, `Server is running`)
})

export type BridgeOpsAPI = typeof routes