import { error } from "@sveltejs/kit";
import { z } from "zod";
import { getRequestEvent, query } from "$app/server";
import { createApiClient } from "$lib/api/apiClient";
import { auth } from "$lib/auth";

export const getWorkspace = query(z.string(), async (slug) => {
	const req = getRequestEvent();

	const { token } = await auth.api.getToken({
		headers: req.request.headers,
	});

	if (!token) {
		error(401, "Missing authentication token");
	}

	const apiClient = createApiClient(token);
	const response = await apiClient.v1.workspaces[":slug"].$get({
		param: { slug },
	});

	if (!response.ok) {
		const body = await response.text();

		console.error(
			{
				status: response.status,
				body,
			},
			"Failed to fetch workspace from API",
		);

		error(500, "Failed to fetch workspace");
	}

	const { workspace } = await response.json();

	return workspace;
});
