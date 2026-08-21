import { fail, type RequestEvent } from "@sveltejs/kit";
import { auth } from "$lib/auth";
import type { Actions, RouteParams } from "./$types";

const getSignupFormData = async (
	event: RequestEvent<RouteParams, "/signup">,
) => {
	const formData = await event.request.formData();
	const name = formData.get("name")?.toString().trim() ?? "";
	const email = formData.get("email")?.toString().trim() ?? "";
	const password = formData.get("password")?.toString() ?? "";

	return { name, email, password };
};

export const actions = {
	register: async (event: RequestEvent<RouteParams, "/signup">) => {
		const { name, email, password } = await getSignupFormData(event);
		console.log(`Register attempt for user: ${name}, email: ${email}`);

		const fieldErrors: Record<string, string> = {};

		if (!name) {
			fieldErrors.name = "Name is required";
		}

		if (!email) {
			fieldErrors.email = "Email is required";
		}

		if (!password) {
			fieldErrors.password = "Password is required";
		}

		if (Object.keys(fieldErrors).length > 0) {
			return fail(400, {
				message: "Please fix the highlighted fields",
				fieldErrors,
			});
		}

		try {
			await auth.api.signUpEmail({
				body: {
					email,
					password,
					name,
					callbackURL: "/",
				},
			});
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : "Registration failed",
				fieldErrors: {},
			});
		}

		return {
			message: "User registered successfully",
		};
	},
} satisfies Actions;
