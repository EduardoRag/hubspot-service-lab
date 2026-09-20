import Fastify from 'fastify';

import { HubSpotApiError } from './errors/hubspot-api.error.js';
import { HubSpotTimeoutError } from './errors/hubspot-timeout.error.js';

import { ticketController } from './modules/tickets/ticket.controller.js';

export const buildApp = () => {
    const app = Fastify({
        logger: true,
    });

    app.setErrorHandler((error, request, reply) => {
        if (error instanceof HubSpotTimeoutError) {
            request.log.error(
                error,
                'HubSpot API request timed out',
            );

            return reply.status(error.statusCode).send({
                error: error.code,
                message: error.message,
            });
        }

        if (error instanceof HubSpotApiError) {
            request.log.error(
                {
                    hubSpotStatusCode: error.hubSpotStatusCode,
                    responseBody: error.responseBody,
                },
                'HubSpot API request failed',
            );

            return reply.status(error.statusCode).send({
                error: error.code,
                message: error.message,
            });
        }

        request.log.error(
            error,
            'Unhandled application error',
        );

        return reply.status(500).send({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
        });
    });

    app.get('/health', async () => {
        return {
            status: 'ok',
        };
    });

    app.register(ticketController);

    return app;
};