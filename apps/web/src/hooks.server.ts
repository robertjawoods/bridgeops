import "varlock/auto-load";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { auth } from "$lib/auth";
import { logger } from "$lib/logger";

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

	try {
		session = await auth.api.getSession({ headers: event.request.headers });
	} catch (error) {
		const details =
			error instanceof Error
				? {
						name: error.name,
						message: error.message,
						stack: error.stack,
						cause: error.cause,
					}
				: { error: String(error) };

		console.error("[auth] getSession failed", {
			method: event.request.method,
			url: event.url.href,
			...details,
		});
		throw error;
	}

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

const handleRequestLogging: Handle = async ({ event, resolve }) => {
	const start = performance.now();

	try {
		const response = await resolve(event);

		logger.info(
			{
				method: event.request.method,
				path: event.url.pathname,
				status: response.status,
				durationMs: Math.round(performance.now() - start),
			},
			"HTTP request",
		);

		return response;
	} catch (error) {
		logger.error(
			{
				err: error,
				method: event.request.method,
				path: event.url.pathname,
				durationMs: Math.round(performance.now() - start),
			},
			"HTTP request failed",
		);

		throw error;
	}
};

export const handle: Handle = sequence(
	handleRequestLogging, 
	handleBetterAuth
);
