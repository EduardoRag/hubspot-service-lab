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

export const updateTicketSchema = z
    .object({
        subject: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        carrier: z.enum(carriers).optional(),
        issueCategory: z.enum(issueCategories).optional(),
        status: z.enum([
            'NEW',
            'RESOLVED',
        ]).optional(),
        resolutionReason: z.enum([
            'Problema resolvido',
            'Reembolso solicitado',
            'Reenvio solicitado',
            'Correção de endereço',
            'Problema com a transportadora',
            'Outro',
        ]).optional(),
    })
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message:
                'At least one field must be provided',
        },
    )
    .refine(
        (data) =>
            data.status !== 'RESOLVED' ||
            data.resolutionReason !== undefined,
        {
            message:
                'resolutionReason is required when status is RESOLVED',
            path: ['resolutionReason'],
        },
    )

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
