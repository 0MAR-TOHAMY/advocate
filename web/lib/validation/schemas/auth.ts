import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
}).strict();

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  firmName: z.string().min(2).optional(),
}).strict();

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
}).strict();

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
}).strict();
