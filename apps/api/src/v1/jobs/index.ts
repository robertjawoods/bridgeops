import { Queue } from "bullmq";
import { ENV } from "varlock/env";
import { AppError } from "../../errors/appError.js";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { AppEnv } from "../../app.js";
import { createJobRequestSchema, createJobResponseSchema } from "./schemas.js";
import { ERROR_CODES } from "../../errors/errorCodes.js";

export type JobQueue = Pick<Queue, "add">;

export const createQueue = (): JobQueue => new Queue(ENV.QUEUE_NAME, {
    connection: {
        url: ENV.QUEUE_URL,
    },
});

const createJobRoute = createRoute({
    method: "post",
    path: "/",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: createJobRequestSchema
                },
            },
        },
    },
    responses: {
        202: {
            description: "Job created",
            content: {
                "application/json": {
                    schema: createJobResponseSchema
                },
            },
        },

        400: {
            description: "Validation failed",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            error: { type: "string" },
                        },
                    },
                },
            },
        }
    }
});


export const createJobs = ({ queue }: { queue: JobQueue }) => new OpenAPIHono<AppEnv>()
    .openapi(createJobRoute, async (ctx) => {
        const body = ctx.req.valid("json");

        const job = await queue.add(body.name ?? "default", body.data ?? {});

        if (!job.id) {
            throw new AppError(ERROR_CODES.INTERNAL_ERROR, "Job was created without an ID");
        }

        return ctx.json({
            id: job.id,
            name: job.name,
        }, 202);

    })
