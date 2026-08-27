import { Hono } from "hono";

import type { AppEnv } from "../app.js";

import workspaces from "./workspaces/index.js";
import { createJobs, createQueue, type JobQueue } from "./jobs/index.js";

export const createV1 = ({
	queue = createQueue(),
}: { queue?: JobQueue } = {}) =>
	new Hono<AppEnv>()
		.basePath("/v1")
		.route("/workspaces", workspaces)
		.route("/jobs", createJobs({ queue }));
