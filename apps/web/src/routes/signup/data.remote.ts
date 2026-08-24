import z from "zod";
import { form, getRequestEvent } from "$app/server";
import { auth } from "$lib/auth";

export const signupForm = form(
	z.object({
		name: z.string().min(1, "Name is required"),
		email: z.email("Invalid email address"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		redirectTo: z.url("Invalid redirect URL"),
	}),
	async ({ name, email, password, redirectTo }) => {
		const event = getRequestEvent();

		try {
			await auth.api.signUpEmail({
				body: {
					email,
					password,
					name,
					callbackURL: redirectTo,
				},
				request: event.request,
			});

			return {
				message:
					"User registered successfully. Please check your email to verify your account.",
			};
		} catch (error) {
			return {
				message: error instanceof Error ? error.message : "Registration failed",
			};
		}
	},
);
