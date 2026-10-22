import { z } from 'zod';
import { PublicationStatus, ALLERGENS, DIETARY_TAGS, SPICE_LEVELS } from '../types/menu';

export const createMenuItemSchema = z.object({
  name: z.string().min(2, 'Dish name must be at least 2 characters long').max(100),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format'),
  shortDescription: z.string().min(3, 'Short description must be at least 3 characters').max(200),
  description: z.string().min(5, 'Full description must be at least 5 characters'),
  // Price can be provided as major unit (e.g. 6850) or minor unit (e.g. 685000); backend standardizes to minor units
  price: z.number().nonnegative('Price must be a positive number'),
  currency: z.string().default('LKR'),
  images: z.array(z.string()).default([]),
  ingredients: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  dietaryTags: z.array(z.string()).default([]),
  spiceLevel: z.string().optional().default('None'),
  preparationTimeMinutes: z.number().int().min(0).max(300).default(15),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  publicationStatus: z.nativeEnum(PublicationStatus).default(PublicationStatus.DRAFT),
  displayOrder: z.number().int().default(0),
  locationIds: z.array(z.string()).default(['loc-colombo-main']),
});

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
  price: z.number().nonnegative('Price must be a positive number').optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters long').max(60),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must consist of lowercase letters, numbers, and hyphens').optional(),
  description: z.string().max(300).optional().default(''),
  image: z.string().optional().default(''),
  displayOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  locationIds: z.array(z.string()).default(['loc-colombo-main']),
});

export const updateCategorySchema = createCategorySchema.partial();

export const uploadMenuImageSchema = z.object({
  image: z.string().min(1, 'Image data or URL is required'),
  filename: z.string().optional(),
});
