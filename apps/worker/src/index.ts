import "varlock/auto-load";

import { ENV } from 'varlock/env';
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
  },
  level: 'info',
});

async function startWorker() {
  const queueUrl = ENV.QUEUE_URL;

  logger.info({ queueUrl }, "Worker starting");

  // Initialize queue client and begin processing jobs here.
  // Return an object with a graceful stop method.
  return {
    async stop() {
      logger.info("Worker stopping");
      // Stop accepting new jobs and wait for active jobs to finish.
    },
  };
}

async function main() {
  const worker = await startWorker();
  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info({ signal }, "Shutdown signal received");

    try {
      await worker.stop();
      logger.info({}, "Worker stopped cleanly");
      process.exit(0);
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Worker shutdown failed"
      );
      process.exit(1);
    }
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  logger.error(
    { error: error instanceof Error ? error.message : String(error) },
    "Worker failed to start"
  );
  process.exit(1);
});