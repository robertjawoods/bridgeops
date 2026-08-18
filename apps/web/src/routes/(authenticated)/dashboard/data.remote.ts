import { getRequestEvent, query } from '$app/server';
import { z } from 'zod';

import { auth } from '$lib/auth';
import { createApiClient } from '$lib/apiClient';

export const getWorkspaces = query(async () => {

    const req = getRequestEvent();

    const {token} = await auth.api.getToken({
        headers: req.request.headers
    });

    if (!token) {
        throw new Error('Missing authentication token');
    }

    console.log('remote function')

    const apiClient = createApiClient(token);
    const response = await apiClient.api.v1.workspaces.$get();

    console.log(response)


    if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
    }

    const data = await response.json();
    return data.workspaces;
});