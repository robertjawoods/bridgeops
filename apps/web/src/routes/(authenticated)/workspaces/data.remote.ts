import { error } from "@sveltejs/kit";
import { getRequestEvent, query } from "$app/server";
import { createApiClient } from "$lib/api/apiClient";

import { auth } from "$lib/auth";
import { logger } from "$lib/logger";

export const getWorkspaces = query(async () => {
	const req = getRequestEvent();

	const { token } = await auth.api.getToken({
		headers: req.request.headers,
	});

	if (!token) {
		error(401, "Missing authentication token");
	}

	const apiClient = createApiClient(token);
	const response = await apiClient.api.v1.workspaces.$get();

	if (!response.ok) {
		const body = await response.text();

		logger.error(
			{
				status: response.status,
				body,
			},
			"Failed to fetch workspaces from API",
		);

		error(500, "Failed to fetch workspaces");
	}

	const data = await response.json();

	return data.workspaces;
});
