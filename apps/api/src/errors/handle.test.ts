import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import pino from 'pino';

import { AppError } from './appError';
import { handle } from './handle';
import { ERROR_CODES } from './errorCodes';
import type { AppEnv } from '../app';

describe('handle', () => {
    it('returns the mapped status and error response for an AppError', async () => {
        const app = new Hono<AppEnv>();

        app.onError(handle);

        app.get('/test', () => {
            throw new AppError(
                ERROR_CODES.NOT_FOUND,
                'Resource not found.'
            );
        });

        const response = await app.request('/test');

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({
            error: {
                code: ERROR_CODES.NOT_FOUND,
                message: 'Resource not found.',
            },
        });
    });

    it('returns 500 for an unknown error', async () => {
        const app = new Hono<AppEnv>();

        app.onError(handle);

        app.get('/test', () => {
            throw new Error('Database connection failed');
        });

        const response = await app.request('/test');

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred.',
            },
        });
    });

    it('does not expose the original error message', async () => {
        const app = new Hono<AppEnv>();

        app.onError(handle);

        app.get('/test', () => {
            throw new Error('SECRET DATABASE DETAILS');
        });

        const response = await app.request('/test');
        const body = await response.text();

        expect(body).not.toContain('SECRET DATABASE DETAILS');
    });

    it('logs unknown errors', async () => {
        const logger = pino({ enabled: false });
        const errorSpy = vi.spyOn(logger, 'error');

        const app = new Hono<AppEnv>();

        app.use('*', async (c, next) => {
            c.set('logger', logger);
            await next();
        });

        app.onError(handle);

        const error = new Error('Database connection failed');

        app.get('/test', () => {
            throw error;
        });

        await app.request('/test');

        expect(errorSpy).toHaveBeenCalledWith(error);
    });
});