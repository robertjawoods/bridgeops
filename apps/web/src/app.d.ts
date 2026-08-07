import type { User, Session } from 'better-auth';
import { authClient } from '$lib/auth';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;
			authClient: ReturnType<typeof authClient>;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
