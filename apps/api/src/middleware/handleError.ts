import { AppError } from "../errors/appError.js";
import { ERROR_STATUS } from "../errors/errorCodes.js";
import type { HTTPResponseError } from "hono/types";
import type { Context } from "hono";
import type { AppEnv } from "../app.js";

/**
 * Request-validation failures never reach here: `@hono/zod-openapi` intercepts them with
 * its own default hook and returns a 400 directly, so a ZodError branch in this handler
 * would be dead code. See `validationErrorSchema` for the shape that hook produces.
 */
export const handleError = (
	error: Error | HTTPResponseError,
	ctx: Context<AppEnv>,
) => {
	ctx.get("logger")?.error({ err: error }, "Request error");

	if (error instanceof AppError) {
		return ctx.json({ error: error.message }, ERROR_STATUS[error.code] ?? 500);
	}

	return ctx.json({ error: "Internal server error" }, 500);
};

export default handleError;
