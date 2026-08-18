import { Hono } from "hono";
import { Queue } from "bullmq";
import { ENV } from "varlock/env";
import { AppError } from "../../errors/appError.js";

const queue = new Queue(ENV.QUEUE_NAME, {
    connection: {
        url: ENV.QUEUE_URL,
    },
});
        
const jobs = new Hono()
    .post("/", async (c) => {
        let body: {
            name?: string;
            data?: Record<string, unknown>;
        };

        try {
            body = await c.req.json();
        } catch (error) {
            throw new AppError(
                "BAD_REQUEST",
                "Request body must be valid JSON.",
                { cause: error }
            );
        }

        const job = await queue.add(body.name ?? "default", body.data ?? {});

        return c.json({
            id: job.id,
            name: job.name,
        }, 202);
    })

export default jobs;