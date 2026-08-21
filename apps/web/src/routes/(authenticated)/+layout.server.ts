import { redirect } from "@sveltejs/kit";

export const load = async ({ locals, url }) => {
	const redirectTo = `${url.pathname}${url.search}`;

	if (!locals.session) {
		redirect(303, `/login?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	return {
		session: locals.session,
	};
};
