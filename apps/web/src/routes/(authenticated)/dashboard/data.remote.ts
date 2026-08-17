import { getRequestEvent, query } from '$app/server';
import { z } from 'zod';
import type { BridgeOpsAPI } from '../../../../../api/src';
import { hc } from 'hono/client'

import { auth } from '$lib/auth';

const apiClient = hc<BridgeOpsAPI>("http://localhost:3000")

export const getWorkspaces = query(async () => {

    const req = getRequestEvent();

    const token = await auth.api.getToken({
        headers: req.request.headers
    });

    console.log('remote function')

    const response = await apiClient.api.v1.workspaces.$get({
        token
    });

    console.log(response)


    if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
    }

    const data = await response.json();
    return data.workspaces;
});