import { getRequestEvent, query } from '$app/server';

import { auth } from '$lib/auth';
import { createApiClient } from '$lib/apiClient';

export const getWorkspaces = query(async () => {

    const req = getRequestEvent();

    const { token } = await auth.api.getToken({
        headers: req.request.headers
    });

    if (!token) {
        throw new Error('Missing authentication token');
    }

    const apiClient = createApiClient(token);
    const response = await apiClient.api.v1.workspaces.$get();

    if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
    }

    const data = await response.json();
    return data.workspaces;
});