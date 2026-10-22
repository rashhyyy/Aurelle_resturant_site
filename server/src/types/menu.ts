/**
 * Aurelle Restaurant Management Platform
 * Menu Management Types (Stage 6)
 */

export enum PublicationStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export const DIETARY_TAGS = [
  'VEGETARIAN',
  'VEGAN',
  'GLUTEN-FREE',
  'DAIRY-FREE',
  'SPICY',
  'HALAL',
  'PLANT-LED',
] as const;

export type DietaryTag = (typeof DIETARY_TAGS)[number];

export const ALLERGENS = [
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Peanuts',
  'Tree Nuts',
  'Soy',
  'Wheat',
  'Sesame',
  'Mustard',
  'Celery',
] as const;

export type Allergen = (typeof ALLERGENS)[number];

export const SPICE_LEVELS = [
  'None',
  'Delicate',
  'Mild spice',
  'Mild zest',
  'Medium spice',
  'Spicy',
  'Extra Spicy',
] as const;

export type SpiceLevel = (typeof SPICE_LEVELS)[number];

export interface IMenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  displayOrder: number;
  isVisible: boolean;
  isArchived: boolean;
  locationIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMenuItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  priceMinor: number; // Stored in integer minor units (e.g. 685000 for LKR 6,850.00)
  currency: string;   // Standard 'LKR'
  formattedPrice: string; // Helper formatted string, e.g. "LKR 6,850"
  images: string[];   // images[0] is primary image
  ingredients: string[];
  allergens: string[];
  dietaryTags: string[];
  spiceLevel?: string;
  preparationTimeMinutes: number;
  isAvailable: boolean;
  isFeatured: boolean;
  publicationStatus: PublicationStatus;
  displayOrder: number;
  locationIds: string[];
  createdBy?: string;
  updatedBy?: string;
  publishedAt?: Date | null;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuSummaryCounts {
  total: number;
  published: number;
  draft: number;
  unavailable: number;
}
