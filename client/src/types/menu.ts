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

export const SPICE_LEVELS = [
  'None',
  'Delicate',
  'Mild spice',
  'Mild zest',
  'Medium spice',
  'Spicy',
  'Extra Spicy',
] as const;

export interface ClientMenuItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  priceMinor: number;
  currency: string;
  formattedPrice: string;
  images: string[];
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
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientMenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  displayOrder: number;
  isVisible: boolean;
  isArchived: boolean;
  locationIds: string[];
}

export interface MenuSummaryCounts {
  total: number;
  published: number;
  draft: number;
  unavailable: number;
}
