import { createRemoteJWKSet, jwtVerify } from 'jose'
import { createMiddleware } from 'hono/factory'
import { ENV } from 'varlock/env';
import { AppError } from '../errors/appError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

export const requireAuth = createMiddleware(async (c, next) => {
	const authorization = c.req.header('Authorization')

	if (!authorization?.startsWith('Bearer ')) {
		throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Missing or invalid Authorization header')
	}

	const token = authorization.slice('Bearer '.length)

	try {
		const jwks = createRemoteJWKSet(
			new URL(`${ENV.APP_URL}/api/auth/jwks`)
		)
		const { payload } = await jwtVerify(token, jwks, {
			issuer: `${ENV.APP_URL}`,
			audience: `${ENV.APP_URL}`
		})

		c.set('userId', payload.sub)

		await next()
	} catch {
		throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Unauthorized')
	}
})