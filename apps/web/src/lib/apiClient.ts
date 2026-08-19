import type { BridgeOpsAPI } from '@bridgeops/api';
import { hc } from 'hono/client';
import { ENV } from 'varlock/env';

export const createApiClient = (token: string) =>
    hc<BridgeOpsAPI>(ENV.API_URL, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
