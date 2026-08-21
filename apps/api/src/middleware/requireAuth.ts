import { createRemoteJWKSet, jwtVerify } from 'jose'
import { createMiddleware } from 'hono/factory'
import { ENV } from 'varlock/env';
import { AppError } from '../errors/appError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

export const requireAuth = createMiddleware(async (c, next) => {
	const authorization = c.req.header('Authorization')
	const logger = c.get('logger')

	if (!authorization?.startsWith('Bearer ')) {
		throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Missing or invalid Authorization header')
	}

	const token = authorization.slice('Bearer '.length)

	logger?.info({ AppUrl: ENV.APP_URL }, 'Verifying JWT')

	try {
		const jwks = createRemoteJWKSet(
			new URL(`${ENV.APP_INTERNAL_URL}/api/auth/jwks`)
		)

		const { payload } = await jwtVerify(token, jwks, {
			issuer: `${ENV.APP_URL}`,
			audience: `${ENV.APP_URL}`
		})

		c.set('userId', payload.sub)

		await next()
	} catch (error) {
		logger?.error({
			errorName: error instanceof Error ? error.name : undefined,
			errorMessage: error instanceof Error ? error.message : String(error),
			errorCode:
				typeof error === "object" && error !== null && "code" in error
					? error.code
					: undefined,
		}, 'Failed to verify JWT')

		throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Unauthorized')
	}
})