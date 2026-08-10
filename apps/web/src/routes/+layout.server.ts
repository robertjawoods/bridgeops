import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	session: locals.session ?? null,
	user: locals.user ?? null
});