import { hubSpotClient } from '../../clients/hubspot.client.js';
import { CreateTicketInput } from './ticket.schema.js';

export const createTicket = async (input: CreateTicketInput) => {
    const ticket = await hubSpotClient.createTicket({
        subject: input.subject,
        content: input.description,
        hs_ticket_priority: input.priority,
        hs_pipeline: '0',
        hs_pipeline_stage: '1',
        carrier: input.carrier,
        issue_category: input.issueCategory,
        external_system: 'Minha Plataforma',
    });

    return ticket;
};

export const getTicket = async (id: string) => {
    return hubSpotClient.getTicket(id);
};