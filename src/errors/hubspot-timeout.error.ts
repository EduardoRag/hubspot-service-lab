import { AppError } from './app.error.js';

export class HubSpotTimeoutError extends AppError {
    constructor() {
        super(
            504,
            'HUBSPOT_TIMEOUT',
            'HubSpot did not respond within the allowed time',
        );

        this.name = 'HubSpotTimeoutError';
    }
}