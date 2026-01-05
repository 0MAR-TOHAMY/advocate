import { z } from 'zod';

export const createCaseSchema = z.object({
  caseNumber: z.string().optional(),
  title: z.string().min(1),
  clientName: z.string().optional(),
  clientId: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['active', 'pending', 'closed', 'archived', 'appeal', 'decided', 'suspended', 'cassation', 'canceled']).default('active'),
  filingDate: z.string().optional(),
  court: z.string().optional(),
  judge: z.string().optional(),
  opposingParty: z.string().optional(),
  caseYear: z.coerce.number().int().optional(),
  linkedCaseId: z.string().optional(),
  syncCaseStage: z.boolean().optional(),
  additionalOpposingParties: z.array(z.any()).optional(),
  password: z.string().optional(),

  // Missing fields reported in ZodError
  caseType: z.enum([
    "civil",
    "criminal",
    "commercial",
    "family",
    "labor",
    "administrative",
    "appeal",
    "civil_appeal",
    "commercial_appeal",
    "criminal_appeal",
    "personal_status_appeal",
    "labor_appeal",
    "administrative_appeal",
    "execution_appeal",
    "cassation_appeal",
    "discrimination_appeal",
    "civil_cassation",
    "commercial_cassation",
    "criminal_cassation",
    "commercial_arbitration",
    "arbitration_execution",
    "arbitration_annulment",
    "payment_order",
    "travel_ban",
    "other",
  ]).default("civil"),
  customCaseType: z.string().optional(),
  claimAmount: z.coerce.string().optional(),
  currency: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  clientCapacity: z.string().optional(),
  opposingPartyCapacity: z.string().optional(),
  caseStage: z.enum([
    "under_preparation",
    "first_instance",
    "appeal",
    "execution",
    "cassation",
    "other",
  ]).optional(),
  customCaseStage: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().optional(),
  clientAddress: z.string().optional(),
  opposingPartyPhone: z.string().optional(),
  opposingPartyEmail: z.string().optional(),
  opposingPartyAddress: z.string().optional(),
  additionalClients: z.array(z.any()).optional(),
}).passthrough();

export const updateCaseSchema = createCaseSchema.partial().extend({
  // Add specific update fields if any
}).strict();

export const caseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  status: z.enum(['active', 'pending', 'closed', 'archived', 'appeal', 'decided', 'suspended', 'cassation', 'canceled', 'all']).optional(),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  clientId: z.string().optional(),
}).passthrough();

export const caseIdParamSchema = z.object({
  id: z.string().min(1),
}).strict();
