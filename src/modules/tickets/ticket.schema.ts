import { z } from 'zod';

export const createTicketSchema = z.object({
    customerName: z.string().min(1),
    customerEmail: z.email(),
    carrier: z.string().min(1),
    issueCategory: z.string().min(1),
    subject: z.string().min(1),
    description: z.string().min(1),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;