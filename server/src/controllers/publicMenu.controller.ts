import { Request, Response } from 'express';
import { MenuItem } from '../models/menuItem.model';
import { MenuCategory } from '../models/menuCategory.model';
import { PublicationStatus } from '../types/menu';
import { logger } from '../utils/logger';

/**
 * Public Menu Sanitizer (Excludes internal fields, staff notes, and audit references)
 */
const toPublicDishJSON = (dish: any) => {
  return dish.toSafeJSON();
};

/**
 * GET /api/menu
 * Public guest menu with category, dietary, search, and availability filtering
 */
export const getPublicMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      categorySlug,
      search,
      dietaryTag,
      featured,
      locationId = 'loc-colombo-main',
      page = '1',
      limit = '50',
      sort = 'recommended',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // 1. Find all active, non-archived, visible categories
    const visibleCategories = await MenuCategory.find({
      isVisible: true,
      isArchived: false,
    }).select('_id slug');

    const visibleCategoryIds = visibleCategories.map((c) => c._id);

    // 2. Base query: strictly PUBLISHED dishes in visible categories
    const query: Record<string, any> = {
      publicationStatus: PublicationStatus.PUBLISHED,
      categoryId: { $in: visibleCategoryIds },
    };

    if (locationId && locationId !== 'all') {
      query.locationIds = locationId;
    }

    // Category filter by slug or name
    if (categorySlug && categorySlug !== 'all' && categorySlug !== 'All') {
      query.categorySlug = categorySlug.toLowerCase();
    } else if (category && category !== 'all' && category !== 'All') {
      const normalizedCat = category.toLowerCase().replace(/[-_]/g, ' ');
      const matchedCat = await MenuCategory.findOne({
        $or: [
          { name: new RegExp(`^${category}$`, 'i') },
          { slug: category.toLowerCase() },
          { name: new RegExp(normalizedCat, 'i') },
        ],
      });
      if (matchedCat) {
        query.categoryId = matchedCat._id;
      }
    }

    // Text Search
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { description: regex },
        { shortDescription: regex },
        { ingredients: regex },
        { dietaryTags: regex },
      ];
    }

    // Dietary Filter
    if (dietaryTag && dietaryTag !== 'all') {
      query.dietaryTags = new RegExp(dietaryTag.trim(), 'i');
    }

    // Featured only
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Sort options
    let sortObj: Record<string, 1 | -1> = { displayOrder: 1, createdAt: 1 };
    if (sort === 'price_asc' || sort === 'Price: Low to High') {
      sortObj = { priceMinor: 1, displayOrder: 1 };
    } else if (sort === 'price_desc' || sort === 'Price: High to Low') {
      sortObj = { priceMinor: -1, displayOrder: 1 };
    }

    const [dishes, total] = await Promise.all([
      MenuItem.find(query).sort(sortObj).skip(skip).limit(limitNum),
      MenuItem.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        dishes: dishes.map(toPublicDishJSON),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (err: any) {
    logger.error('[PublicMenuController] getPublicMenu error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve public menu.' });
  }
};

/**
 * GET /api/menu/categories
 * Visible menu categories for navigation & filter bar
 */
export const getPublicCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await MenuCategory.find({
      isVisible: true,
      isArchived: false,
    }).sort({ displayOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: categories.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        displayOrder: c.displayOrder,
      })),
    });
  } catch (err: any) {
    logger.error('[PublicMenuController] getPublicCategories error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
};

/**
 * GET /api/menu/featured
 * Highlights and chef recommendations
 */
export const getPublicFeatured = async (_req: Request, res: Response): Promise<void> => {
  try {
    const dishes = await MenuItem.find({
      publicationStatus: PublicationStatus.PUBLISHED,
      isFeatured: true,
    })
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      data: dishes.map(toPublicDishJSON),
    });
  } catch (err: any) {
    logger.error('[PublicMenuController] getPublicFeatured error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve featured dishes.' });
  }
};

/**
 * GET /api/menu/:slug
 * Single dish by slug
 */
export const getPublicMenuItemBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const dish = await MenuItem.findOne({
      slug: slug.toLowerCase(),
      publicationStatus: PublicationStatus.PUBLISHED,
    });

    if (!dish) {
      res.status(404).json({ success: false, message: 'Dish not found or is currently unpublished.' });
      return;
    }

    res.status(200).json({ success: true, data: toPublicDishJSON(dish) });
  } catch (err: any) {
    logger.error('[PublicMenuController] getPublicMenuItemBySlug error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve dish details.' });
  }
};
