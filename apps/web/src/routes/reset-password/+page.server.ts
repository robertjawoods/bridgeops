// todo: validate with zod

import { type RequestEvent, redirect } from "@sveltejs/kit";
import { auth } from "$lib/auth";
import type { Actions, RouteParams } from "./$types";

const getResetFormData = async (
	event: RequestEvent<RouteParams, "/reset-password">,
) => {
	const formData = await event.request.formData();

	const newPassword = formData.get("password")?.toString() ?? "";
	const confirmation = formData.get("confirmation")?.toString() ?? "";
	const token = formData.get("token")?.toString() ?? "";

	return { newPassword, confirmation, token };
};

export const actions = {
	reset: async (event: RequestEvent<RouteParams, "/reset-password">) => {
		const { newPassword, confirmation, token } = await getResetFormData(event);

		console.log(token);

		if (!token) {
			return "Token is invalid";
		}

		if (newPassword !== confirmation) {
			return "Password and confirmation must match";
		}

		const { status } = await auth.api.resetPassword({
			body: {
				newPassword,
				token,
			},
			headers: event.request.headers,
		});

		// todo: notify of success

		if (status) {
			redirect(303, "/login");
		}
	},
} satisfies Actions;
