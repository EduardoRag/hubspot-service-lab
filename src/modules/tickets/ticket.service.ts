import { hubSpotClient } from '../../clients/hubspot.client.js';
import { HubSpotApiError } from '../../errors/hubspot-api.error.js';
import type { CreateTicketInput, UpdateTicketInput } from './ticket.schemas.js';

export const createTicket = async (input: CreateTicketInput) => {
    const existingTicket =
        await hubSpotClient.getTicketByExternalId(
            input.externalTicketId,
        );

    if (existingTicket.total > 0) {
        return existingTicket.results[0];
    }

    try {
        const ticket = await hubSpotClient.createTicket({
            subject: input.subject,
            content: input.description,
            hs_ticket_priority: input.priority,
            hs_pipeline: '0',
            hs_pipeline_stage: '1',
            carrier: input.carrier,
            issue_category: input.issueCategory,
            external_system: 'Meu Teste',
            external_ticket_id: input.externalTicketId,
        });

        return ticket;
    } catch (error) {
        if (
            error instanceof HubSpotApiError &&
            error.hubSpotStatusCode === 409
        ) {
            const ticketCreatedByAnotherRequest =
                await hubSpotClient.getTicketByExternalId(
                    input.externalTicketId,
                );

            if (ticketCreatedByAnotherRequest.total > 0) {
                return ticketCreatedByAnotherRequest.results[0];
            }
        }

        throw error;
    }
};

export const getTicket = async (id: string) => {
    return hubSpotClient.getTicket(id);
};

export const updateTicket = async (
    id: string,
    input: UpdateTicketInput,
) => {
    const properties: Record<string, string> = {};

    if (input.subject !== undefined) properties.subject = input.subject;

    if (input.description !== undefined) properties.content = input.description;

    if (input.priority !== undefined) properties.hs_ticket_priority = input.priority;

    if (input.carrier !== undefined) properties.carrier = input.carrier;

    if (input.issueCategory !== undefined) properties.issue_category = input.issueCategory;

    if (input.resolutionReason !== undefined) {
        properties.motivo_da_resolucao = input.resolutionReason;
    }

    if (input.status !== undefined) {
        const pipelineStages = {
            NEW: '1',
            RESOLVED: '1440293259',
        } as const;

        properties.hs_pipeline_stage = pipelineStages[input.status];
    }

    return hubSpotClient.updateTicket(
        id,
        properties,
    );
};