import z from "zod"
import { AppError } from "../errors/appError.js"
import { ERROR_CODES } from "../errors/errorCodes.js"
import type { HTTPResponseError } from "hono/types";
import type { Context } from "hono";
import type { AppEnv } from "../app.js";

export const handleError = (error: Error | HTTPResponseError, ctx: Context<AppEnv, any, {}>) => {
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
            switch (error.code) {
                case ERROR_CODES.UNAUTHENTICATED:
                    return ctx.json(
                        { error: error.message },
                        401,
                    );

                case ERROR_CODES.CONFLICT:
                    return ctx.json(
                        { error: error.message },
                        409,
                    );

                // other application error codes...
            }
        }

        ctx.get("logger")?.error(
            { err: error },
            "Unhandled application error",
        );

        return ctx.json(
            { error: "Internal server error" },
            500,
        );
};

export default handleError;