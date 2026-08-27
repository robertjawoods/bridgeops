import { ENV } from "varlock/env";
import { Redis } from "ioredis";
import pino from "pino";

import { Worker } from "bullmq";

const logger = pino({
	transport: {
		target: "pino-pretty",
	},
	level: "info",
});

async function startWorker() {
	logger.info("Worker starting");

	const redis = new Redis(ENV.QUEUE_URL, {
		maxRetriesPerRequest: null,
	});
	const redisStatus = await redis.ping();

	logger.info({ redisStatus }, "Redis connection established");

	// Initialize queue client and begin processing jobs here.
	// Return an object with a graceful stop method.

	const worker = new Worker(
		ENV.QUEUE_NAME,
		async (job) => {
			logger.info({ jobId: job.id, jobName: job.name }, "Processing job");
			// Job processing logic here
		},
		{ connection: redis },
	);

	worker.on("completed", (job) => {
		logger.info({ jobId: job.id, jobName: job.name }, "Job completed");
	});

	worker.on("failed", (job, err) => {
		logger.error(
			{ jobId: job?.id, jobName: job?.name, error: err.message },
			"Job failed",
		);
	});

	return {
		async stop() {
			logger.info("Worker stopping");
			// Stop accepting new jobs and wait for active jobs to finish.
			await worker.close();
			await redis.quit();
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
				"Worker shutdown failed",
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
		"Worker failed to start",
	);
	process.exit(1);
});
