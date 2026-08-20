import type { BridgeOpsAPI } from '@bridgeops/api';
import { hc } from 'hono/client';

export const createApiClient = (token: string) =>
    hc<BridgeOpsAPI>('http://localhost:3000', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
