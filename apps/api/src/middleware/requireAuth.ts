import { createRemoteJWKSet, jwtVerify } from 'jose'
import { createMiddleware } from 'hono/factory'
import { ENV } from 'varlock/env';
import { AppError } from '../errors/appError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

const JWKS = createRemoteJWKSet(
	new URL(`${ENV.APP_URL}/api/auth/jwks`)
)

export const requireAuth = createMiddleware(async (c, next) => {
	console.log(c.req.raw)

	const authorization = c.req.header('Authorization')

	console.log('Authorization header:', authorization)

	if (!authorization?.startsWith('Bearer ')) {
		throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Missing or invalid Authorization header')
	}

	const token = authorization.slice('Bearer '.length)

	try {
		const { payload } = await jwtVerify(token, JWKS, {
			issuer: `${ENV.APP_URL}`,
			audience: `${ENV.APP_URL}`
		})

		c.set('userId', payload.sub)

		await next()
	} catch {
		throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Unauthorized')
	}
})