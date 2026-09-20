import { env } from '../config/env.js';
import { HubSpotApiError } from '../errors/hubspot-api.error.js';
import { HubSpotTimeoutError } from '../errors/hubspot-timeout.error.js';

const HUBSPOT_BASE_URL = 'https://api.hubapi.com';

const HUBSPOT_TIMEOUT_MS = 15_000;

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
        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, HUBSPOT_TIMEOUT_MS);

        try {
            const response = await fetch(
                `${HUBSPOT_BASE_URL}${path}`,
                {
                    method,
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: body
                        ? JSON.stringify(body)
                        : undefined,
                    signal: controller.signal,
                },
            );

            const responseText = await response.text();

            let responseBody: unknown;

            try {
                responseBody = responseText
                    ? JSON.parse(responseText)
                    : undefined;
            } catch {
                responseBody = responseText;
            }

            if (!response.ok) {
                throw new HubSpotApiError(
                    response.status,
                    responseBody,
                );
            }

            return responseBody as T;
        } catch (error) {
            if (
                error instanceof DOMException &&
                error.name === 'AbortError'
            ) {
                throw new HubSpotTimeoutError();
            }

            throw error;
        } finally {
            clearTimeout(timeout);
        }
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

    async getTicketByExternalId(externalTicketId: string) {
        return this.request<{
            total: number;
            results: Array<{
                id: string;
                properties: Record<string, string>;
            }>;
        }>({
            method: 'POST',
            path: '/crm/v3/objects/tickets/search',
            body: {
                filterGroups: [
                    {
                        filters: [
                            {
                                propertyName: 'external_ticket_id',
                                operator: 'EQ',
                                value: externalTicketId,
                            },
                        ],
                    },
                ],
                properties: [
                    'subject',
                    'content',
                    'hs_ticket_priority',
                    'hs_pipeline',
                    'hs_pipeline_stage',
                    'carrier',
                    'issue_category',
                    'external_system',
                    'external_ticket_id',
                ],
                limit: 1,
            },
        });
    }
}

export const hubSpotClient = new HubSpotClient(
    env.HUBSPOT_ACCESS_TOKEN,
);