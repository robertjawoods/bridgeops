import { Hono } from "hono";

import workspaces from "./workspaces/index.js";
import { createJobs, createQueue, type JobQueue } from "./jobs/index.js";

export const createV1 = ({ queue = createQueue() }: { queue?: JobQueue } = {}) => new Hono().basePath("/v1")
    .route("/workspaces", workspaces)
    .route("/jobs", createJobs({ queue }));
