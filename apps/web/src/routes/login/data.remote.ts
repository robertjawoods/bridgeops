import { redirect } from "@sveltejs/kit";
import { z } from "zod";
import { form, getRequestEvent } from "$app/server";
import { auth } from "$lib/auth";

const authSchema = z.object({
	action: z.enum(["login", "magicLink", "forgotPassword"]),
	email: z.string(),
	password: z.string().optional(),
	redirectTo: z.string().default("/"),
});

const authForm = form(
	authSchema,
	async ({ action, email, password, redirectTo }) => {
		const event = getRequestEvent();

		switch (action) {
			case "login":
				try {
					await auth.api.signInEmail({
						body: {
							email,
							password: password as string,
						},
						request: event.request,
					});
				} catch {
					return {
						message: "Invalid email or password.",
					};
				}

				// `redirect` throws (and is typed `never`), so it has to sit outside
				// the try — inside it, the catch above would swallow the redirect
				// and report a bad login instead.
				return redirect(303, redirectTo);

			case "magicLink":
				await auth.api.signInMagicLink({
					body: {
						email,
						callbackURL: redirectTo,
					},
					headers: event.request.headers,
				});

				return {
					message: "Check your email for a magic link",
				};

			case "forgotPassword":
				await auth.api.requestPasswordReset({
					body: {
						email,
						redirectTo: "/reset-password",
					},
					headers: event.request.headers,
				});

				return {
					message: "Check your email for a password reset link",
				};
		}
	},
);

export { authForm };
