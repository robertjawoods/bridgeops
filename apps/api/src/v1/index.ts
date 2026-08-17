import { Hono } from "hono";

import workspaces from "./workspaces/index.js";

const v1 = new Hono().basePath("/v1").route("/workspaces", workspaces);

export default v1;