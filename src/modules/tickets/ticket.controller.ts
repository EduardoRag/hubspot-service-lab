import type { FastifyInstance } from 'fastify';

import { createTicketSchema } from './ticket.schema.js';
import { createTicket, getTicket } from './ticket.service.js';

export const ticketController = async (app: FastifyInstance) => {
    app.post('/api/tickets', async (request, reply) => {
        const parsed = createTicketSchema.safeParse(request.body);

        if (!parsed.success) {
            return reply.status(400).send({
                error: 'VALIDATION_ERROR',
                message: 'Invalid request body',
                details: parsed.error.flatten(),
            });
        }

        const ticket = await createTicket(parsed.data);

        return reply.status(201).send(ticket);
    });

    app.get('/api/tickets/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        const ticket = await getTicket(id);

        return reply.send(ticket);
    });
};