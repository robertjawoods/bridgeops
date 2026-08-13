import { serve } from '@hono/node-server'
import pino from 'pino';
import { createApp } from './app';

const rootLogger = pino({
  transport: {
    target: 'pino-pretty'
  }
})

const app = createApp({ rootLogger });

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  rootLogger.info({ port: info.port }, `Server is running`)
})
