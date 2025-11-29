/**
 * Zod validation schemas for Module API endpoints
 * Story 1.5: Create Module API Endpoints
 */

import { z } from 'zod';

/**
 * Schema for creating a new module
 * Required: title
 * Optional: description, requiresPrevious
 */
export const createModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  requiresPrevious: z.boolean().default(true),
});

/**
 * Schema for updating an existing module
 * All fields are optional for partial updates
 */
export const updateModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').optional(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').nullable().optional(),
  isPublished: z.boolean().optional(),
  requiresPrevious: z.boolean().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
