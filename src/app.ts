import Fastify from 'fastify';

import { ticketController } from './modules/tickets/ticket.controller.js';

export const buildApp = () => {
    const app = Fastify({
        logger: true,
    });

    app.get('/health', async () => {
        return {
            status: 'ok',
        };
    });

    app.register(ticketController);

    return app;
};