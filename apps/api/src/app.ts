import {
	prisma,
	type MembershipRole,
	type Workspace,
} from "@bridgeops/database";
import { Hono } from "hono";
import pino from "pino";
import { handleError } from "./middleware/handleError.js";

import { setupMiddleware } from "./middleware/index.js";

export type AppEnv = {
	Variables: {
		userId: string;
		requestId: string;
		logger: pino.Logger;
		/** The full workspace row, resolved by `workspaceAuthorisation`. */
		workspace: Workspace;
		workspaceId: string;
		workspaceMembership: { id: string; role: MembershipRole };
		workspaceRole: MembershipRole;
	};
};

export const createApp = ({
	rootLogger,
	api = new Hono(),
}: {
	rootLogger: pino.Logger;
	api?: Hono<AppEnv>;
}) => {
	const app = new Hono<AppEnv>({
		strict: true,
	});

	setupMiddleware(app, rootLogger);

	app.onError(handleError);

	app.get("/", (c) => {
		return c.text("Hello BridgeOps!");
	});

	app.get("/healthz", (c) => {
		return c.text("alive");
	});

	app.get("/ready", async (c) => {
		await prisma.$queryRaw`SELECT 1`;

		return c.text("ready");
	});

	app.route("/api", api);

	return { app };
};
