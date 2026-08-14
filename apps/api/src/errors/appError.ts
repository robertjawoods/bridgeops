import { ErrorCode } from "./errorCodes";

export class AppError extends Error {
    constructor(
        public readonly code: ErrorCode,
        message: string,
        options?: { cause?: unknown }
    ) {
        super(message, options);
        this.name = 'AppError';
    }
}