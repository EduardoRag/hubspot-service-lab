import { env } from '../config/env.js';

const HUBSPOT_BASE_URL = 'https://api.hubapi.com';

type HubSpotRequestOptions = {
    method: 'GET' | 'POST' | 'PATCH';
    path: string;
    body?: unknown;
};

export class HubSpotClient {
    private readonly accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async request<T>({
        method,
        path,
        body,
    }: HubSpotRequestOptions): Promise<T> {
        const response = await fetch(`${HUBSPOT_BASE_URL}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const responseText = await response.text();

        let responseBody: unknown;

        try {
            responseBody = responseText ? JSON.parse(responseText) : undefined;
        } catch {
            responseBody = responseText;
        }

        if (!response.ok) {
            throw new Error(
                `HubSpot API error: ${response.status} ${JSON.stringify(responseBody)}`,
            );
        }

        return responseBody as T;
    }

    async createTicket(properties: Record<string, string>) {
        return this.request<{
            id: string;
            properties: Record<string, string>;
        }>({
            method: 'POST',
            path: '/crm/v3/objects/tickets',
            body: {
                properties,
            },
        });
    }

    async getTicket(id: string) {
        return this.request<{
            id: string;
            properties: Record<string, string>;
        }>({
            method: 'GET',
            path: `/crm/v3/objects/tickets/${id}`,
        });
    }

    async updateTicket(
        id: string,
        properties: Record<string, string>,
    ) {
        return this.request<{
            id: string;
            properties: Record<string, string>;
        }>({
            method: 'PATCH',
            path: `/crm/v3/objects/tickets/${id}`,
            body: {
                properties,
            },
        });
    }
}

export const hubSpotClient = new HubSpotClient(
    env.HUBSPOT_ACCESS_TOKEN,
);