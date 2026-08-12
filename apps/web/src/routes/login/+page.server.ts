import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import type { Actions, PageServerLoad } from './$types';

const getLoginFormData = async (event: any) => {
	const formData = await event.request.formData();

	const email = formData.get('email')?.toString().trim() ?? '';
	const password = formData.get('password')?.toString() ?? '';
	const redirectTo = formData.get('redirectTo')?.toString() ?? '/';

	return { email, password, redirectTo };
};

export const load: PageServerLoad = ({ url }) => {
	return {
		redirectTo: url.searchParams.get('redirectTo') ?? '/'
	};
};

export const actions = {
	login: async (event) => {
		const { email, password, redirectTo } = await getLoginFormData(event);

		const fieldErrors: Record<string, string> = {};

		if (!email) {
			fieldErrors.email = 'Email is required';
		}

		if (!password) {
			fieldErrors.password = 'Password is required';
		}

		if (Object.keys(fieldErrors).length > 0) {
			return fail(400, {
				message: 'Please fix the highlighted fields',
				fieldErrors
			});
		}

		try {
			await auth.api.signInEmail({
				body: {
					email,
					password
				}
			});
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Login failed',
				fieldErrors: {}
			});
		}

		redirect(303, redirectTo);
	}
} satisfies Actions;
