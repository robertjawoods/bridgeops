import { Hono } from "hono";

import workspaces from "./workspaces/index.js";
import jobs from "./jobs/index.js";

const v1 = new Hono().basePath("/v1")
    .route("/workspaces", workspaces)
    .route("/jobs", jobs);

export default v1;