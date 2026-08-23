import { createMiddleware } from 'hono/factory'
import { AppError } from '../errors/appError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { prisma } from '@bridgeops/database';


export const workspaceAuthorisation = createMiddleware(async (c, next) => {
	const userId = c.get('userId')
	const slug = c.req.param('slug')

	if (!userId || !slug) {
		throw new AppError(ERROR_CODES.FORBIDDEN, 'Forbidden')
	}

	const workspace = await prisma.workspace.findFirst({
		where: {
			memberships:{
				some: {
					userId: userId,
				}
			},
			slug
		},
		select: {
			id: true,
			memberships: {
				where: {
					userId: userId,
				},
				select: {
					id: true,
					role: true
				}
			}
		}
	})

	if (!workspace) {
		throw new AppError(ERROR_CODES.FORBIDDEN, 'Forbidden')
	}
	
	const membership = workspace?.memberships.at(0);

	if (!membership) {
		throw new AppError(ERROR_CODES.FORBIDDEN, 'Forbidden')
	}

	c.set('workspaceId', workspace?.id)
	c.set('workspaceMembership', membership)
	c.set('workspaceRole', membership.role)

	await next()
})