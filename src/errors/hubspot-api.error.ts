import { AppError } from './app.error.js';

export class HubSpotApiError extends AppError {
    constructor(
        public readonly hubSpotStatusCode: number,
        public readonly responseBody: unknown,
    ) {
        super(
            502,
            'HUBSPOT_API_ERROR',
            'Failed to communicate with HubSpot',
        );

        this.name = 'HubSpotApiError';
    }
}