import 'varlock/auto-load';
import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	let session;

	try {
		session = await auth.api.getSession({ headers: event.request.headers });
	} catch (error) {
		const details = error instanceof Error
			? { name: error.name, message: error.message, stack: error.stack, cause: error.cause }
			: { error: String(error) };

		console.error('[auth] getSession failed', {
			method: event.request.method,
			url: event.url.href,
			...details
		});
		throw error;
	}

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
