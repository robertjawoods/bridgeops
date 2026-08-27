import type { Hono } from "hono";
import pino from "pino";
import { vi } from "vitest";
import { type AppEnv, createApp } from "../../../api/src/app.js";
import type { JobQueue } from "../../../api/src/v1/jobs/index.js";
import { createV1 } from "../../../api/src/v1/index.js";
import { bearer } from "./auth.js";

/**
 * A stand-in for the BullMQ queue.
 *
 * `createV1` only calls the real `createQueue()` when `queue` is omitted, so injecting
 * this keeps the whole suite off Redis.
 */
export const fakeQueue = (
	job: { id?: string; name?: string } | null = { id: "job-1", name: "deploy" },
) =>
	({
		add: vi.fn().mockResolvedValue(job),
	}) as unknown as JobQueue & { add: ReturnType<typeof vi.fn> };

/**
 * Build the real app with the v1 router mounted.
 *
 * `createApp({ rootLogger })` alone mounts a bare `new Hono()` at `/api`, so no v1
 * routes exist and every authenticated test would 401 for the wrong reason. Always go
 * through this helper.
 */
export const buildTestApp = ({ queue = fakeQueue() }: { queue?: JobQueue } = {}) => {
	const { app } = createApp({
		rootLogger: pino({ level: "silent" }),
		api: createV1({ queue }),
	});

	return app;
};

type RequestOptions = RequestInit & {
	/** Mint and attach a valid bearer token for this user id. */
	as?: string;
	/** Attach a verbatim Authorization header (for negative auth cases). */
	authorization?: string;
	json?: unknown;
};

/** Issue a request against the app, handling token minting and JSON bodies. */
export const request = async (
	app: Hono<AppEnv>,
	path: string,
	{ as, authorization, json, ...init }: RequestOptions = {},
) => {
	const headers = new Headers(init.headers);

	if (as !== undefined) headers.set("Authorization", await bearer(as));
	if (authorization !== undefined) headers.set("Authorization", authorization);
	if (json !== undefined) headers.set("Content-Type", "application/json");

	return app.request(path, {
		...init,
		headers,
		...(json !== undefined ? { body: JSON.stringify(json) } : {}),
	});
};
