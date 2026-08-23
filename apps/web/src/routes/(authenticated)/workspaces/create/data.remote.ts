import { error, redirect } from "@sveltejs/kit";
import { z } from "zod";
import { form, getRequestEvent } from "$app/server";
import { createApiClient } from "$lib/api/apiClient";
import { auth } from "$lib/auth";
import { logger } from "$lib/logger";

export const createWorkspace = form(
	z.object({
		name: z.string().min(1, "Name is required"),
		slug: z.string().min(1, "Slug is required"),
	}),
	async ({ name, slug }) => {
		const req = getRequestEvent();

		const { token } = await auth.api.getToken({
			headers: req.request.headers,
		});

		if (!token) {
			error(401, "Missing authentication token");
		}

		const apiClient = createApiClient(token);
		const response = await apiClient.v1.workspaces.$post({
			json: { name, slug },
		});

		if (!response.ok) {
			const body = await response.json();

			logger.error(
				{
					status: response.status,
					body,
				},
				"Failed to create workspace via API",
			);

			error(response.status, body.error ?? "Failed to create workspace");
		}

		redirect(303, `/workspaces/${slug}`);
	},
);
