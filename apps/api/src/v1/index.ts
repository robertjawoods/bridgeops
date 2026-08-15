import { Hono } from "hono";

import workspaces from "./workspaces";

const v1 = new Hono().basePath("/v1");

v1.route("/workspaces", workspaces);

export default v1;