import type { ErrorHandler } from 'hono';
import { AppError } from './appError.js';
import { ERROR_STATUS } from './errorCodes.js';


export const handle: ErrorHandler = (error, c) => {
    if (error instanceof AppError) {
        const status = ERROR_STATUS[error.code] ?? 500;

        return c.json(
            {
                error: {
                    code: error.code,
                    message: error.message,
                },
            },
            status
        );
    }

    c.get('logger')?.error?.(error);

    return c.json(
        {
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred.',
            },
        },
        500
    );
};