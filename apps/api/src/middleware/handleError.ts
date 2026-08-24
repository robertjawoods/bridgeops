import z from "zod"
import { AppError } from "../errors/appError.js"
import { ERROR_STATUS } from "../errors/errorCodes.js"
import type { HTTPResponseError } from "hono/types";
import type { Context } from "hono";
import type { AppEnv } from "../app.js";

export const handleError = (error: Error | HTTPResponseError, ctx: Context<AppEnv, any, {}>) => {
        ctx.get("logger")?.error({ err: error }, "Request error");

        if (error instanceof z.ZodError) {
            return ctx.json(
                {
                    error: "Validation failed",
                    fields: error.issues.map(({ path, message }) => ({
                        field: path.join("."),
                        message,
                    })),
                },
                400,
            );
        }

        if (error instanceof AppError) {
            return ctx.json(
                { error: error.message },
                ERROR_STATUS[error.code] ?? 500,
            );
        }

        return ctx.json(
            { error: "Internal server error" },
            500,
        );
};

export default handleError;
