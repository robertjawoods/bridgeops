import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import z from "zod";
import type { AppEnv } from "../../api/src/app.js";
import { AppError } from "../../api/src/errors/appError.js";
import { ERROR_CODES } from "../../api/src/errors/errorCodes.js";
import { handleError } from "../../api/src/middleware/handleError.js";

/**
 * `handleError` is the handler `createApp` actually registers via `app.onError`. It is
 * exercised indirectly by every other suite; these cases pin the mapping directly.
 */
const buildHarness = (thrown: unknown) => {
	const app = new Hono<AppEnv>({ strict: true });

	app.onError(handleError);
	app.get("/boom", () => {
		throw thrown;
	});

	return app;
};

describe("handleError", () => {
	it.each([
		[ERROR_CODES.BAD_REQUEST, 400],
		[ERROR_CODES.UNAUTHENTICATED, 401],
		[ERROR_CODES.FORBIDDEN, 403],
		[ERROR_CODES.NOT_FOUND, 404],
		[ERROR_CODES.CONFLICT, 409],
		[ERROR_CODES.VALIDATION_ERROR, 422],
		[ERROR_CODES.INTERNAL_ERROR, 500],
	])("maps %s to %i", async (code, status) => {
		const response = await buildHarness(new AppError(code, "something went wrong")).request(
			"/boom",
		);

		expect(response.status).toBe(status);
	});

	it("returns the AppError message in the flat documented shape", async () => {
		const response = await buildHarness(
			new AppError(ERROR_CODES.NOT_FOUND, "Workspace not found"),
		).request("/boom");

		expect(await response.json()).toEqual({ error: "Workspace not found" });
	});

	it("falls back to 500 for an unrecognised error code", async () => {
		const response = await buildHarness(new AppError("NOT_A_REAL_CODE", "mystery")).request(
			"/boom",
		);

		expect(response.status).toBe(500);
	});

	// Request validation is handled by @hono/zod-openapi's default hook, which returns a
	// 400 itself rather than throwing. A ZodError therefore only reaches this handler if
	// application code throws one directly, in which case it is an unexpected error and
	// is masked like any other.
	it("treats a ZodError as an unexpected error", async () => {
		const result = z.object({ name: z.string().min(1, "Name is required") }).safeParse({
			name: "",
		});

		const response = await buildHarness(result.error).request("/boom");

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: "Internal server error" });
	});

	it("hides the details of an unexpected error", async () => {
		const response = await buildHarness(
			new Error("connection string postgres://user:hunter2@db"),
		).request("/boom");

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: "Internal server error" });
	});
});
