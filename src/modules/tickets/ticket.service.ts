import { hubSpotClient } from '../../clients/hubspot.client.js';
import { CreateTicketInput } from './ticket.schema.js';

export const createTicket = async (input: CreateTicketInput) => {
    const ticket = await hubSpotClient.createTicket({
        subject: input.subject,
        content: input.description,
        hs_ticket_priority: input.priority,
        carrier: input.carrier,
    });

    return ticket;
};

export const getTicket = async (id: string) => {
    return hubSpotClient.getTicket(id);
};