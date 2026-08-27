import { describe, expect, it } from "vitest";
import { AppError } from "./appError.js";
import { ERROR_CODES } from "./errorCodes.js";

describe("AppError", () => {
	it("creates an error with the supplied code and message", () => {
		const error = new AppError(ERROR_CODES.NOT_FOUND, "Resource not found.");

		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(AppError);
		expect(error.name).toBe("AppError");
		expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
		expect(error.message).toBe("Resource not found.");
	});

	it("preserves the cause when provided", () => {
		const cause = new Error("Database failure");

		const error = new AppError(
			ERROR_CODES.INTERNAL_ERROR,
			"An unexpected error occurred.",
			{ cause },
		);

		expect(error.cause).toBe(cause);
	});

	it("works without a cause", () => {
		const error = new AppError(ERROR_CODES.BAD_REQUEST, "Invalid request.");

		expect(error.cause).toBeUndefined();
	});
});
