import { z } from 'zod';

const carriers = [
    'Jadlog',
    'Correios',
    'Loggi',
    'FedEx',
] as const;

const issueCategories = [
    'Entrega atrasada',
    'Pacote danificado',
    'Endereço incorreto',
    'Pacote não localizado',
    'Outro',
] as const;

export const createTicketSchema = z.object({
    externalTicketId: z.string().min(1),
    customerName: z.string().min(1),
    customerEmail: z.email(),
    carrier: z.enum(carriers),
    issueCategory: z.enum(issueCategories),
    subject: z.string().min(1),
    description: z.string().min(1),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;