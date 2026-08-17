import { query } from '$app/server';
import { z } from 'zod';
import type { BridgeOpsAPI } from '../../../../../api/src';
import { hc } from 'hono/client'

const apiClient = hc<BridgeOpsAPI>("http://localhost:3000")

export const getWorkspaces = query(z.string(), async (token: string) => {

    const response = await apiClient.api.v1.workspaces.$get({
        token
    });


    if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
    }

    const data = await response.json();
    return data.workspaces;
});