import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MenuItem } from '../models/menuItem.model';
import { MenuCategory } from '../models/menuCategory.model';
import { PublicationStatus, IMenuItem } from '../types/menu';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  createCategorySchema,
  updateCategorySchema,
  uploadMenuImageSchema,
} from '../validations/menu.validation';
import { recordStaffAuditLog } from '../utils/auditLogger';
import { storeMenuImage } from '../utils/imageStorage';
import { getIO } from '../sockets/socket.server';
import { logger } from '../utils/logger';

// Helper: convert string to URL slug
const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

// Helper: ensure price is stored as integer minor units (e.g. 6,850 LKR -> 685000 minor units)
const toMinorUnits = (price: number): number => {
  // If price is passed as standard whole amount (e.g. 6850), multiply by 100
  // If already a large minor unit integer (> 50000), check if it's already minor unit
  if (price < 50000) {
    return Math.round(price * 100);
  }
  return Math.round(price);
};

// Helper to broadcast safe real-time event via Socket.IO
const notifyMenuChanged = (event: string, payload: any) => {
  try {
    const io = getIO();
    io.emit(event as any, payload);
  } catch (err) {
    // Socket.IO may not be active in non-http test runs
  }
};

/**
 * GET /api/admin/menu/summary
 * KPI summary metrics (Total, Published, Draft, Unavailable)
 */
export const getAdminMenuSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const [total, published, draft, unavailable] = await Promise.all([
      MenuItem.countDocuments({ publicationStatus: { $ne: PublicationStatus.ARCHIVED } }),
      MenuItem.countDocuments({ publicationStatus: PublicationStatus.PUBLISHED }),
      MenuItem.countDocuments({ publicationStatus: PublicationStatus.DRAFT }),
      MenuItem.countDocuments({
        publicationStatus: PublicationStatus.PUBLISHED,
        isAvailable: false,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        published,
        draft,
        unavailable,
      },
    });
  } catch (err: any) {
    logger.error('[AdminMenuController] getAdminMenuSummary error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve menu summary.' });
  }
};

/**
 * GET /api/admin/menu
 * Paginated and filtered food item directory
 */
export const getAdminMenuList = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      categoryId,
      categorySlug,
      status,
      availability,
      isFeatured,
      locationId,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, any> = {};

    // Exclude permanently deleted / default archive filter unless requested
    if (status && status !== 'ALL') {
      query.publicationStatus = status;
    } else {
      query.publicationStatus = { $ne: PublicationStatus.ARCHIVED };
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { description: regex }, { shortDescription: regex }];
    }

    if (categoryId && categoryId !== 'all') {
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        query.categoryId = new mongoose.Types.ObjectId(categoryId);
      }
    }

    if (categorySlug && categorySlug !== 'all') {
      query.categorySlug = categorySlug;
    }

    if (availability && availability !== 'ALL') {
      query.isAvailable = availability === 'true' || availability === 'AVAILABLE';
    }

    if (isFeatured !== undefined && isFeatured !== 'ALL') {
      query.isFeatured = isFeatured === 'true';
    }

    if (locationId && locationId !== 'all') {
      query.locationIds = locationId;
    }

    // Sort definition
    const validSortFields = ['createdAt', 'name', 'priceMinor', 'displayOrder', 'publicationStatus', 'updatedAt', 'isAvailable'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection: 1 | -1 = sortOrder === 'asc' ? 1 : -1;

    const [dishes, total] = await Promise.all([
      MenuItem.find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      MenuItem.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        dishes: dishes.map((d) => d.toSafeJSON()),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (err: any) {
    logger.error('[AdminMenuController] getAdminMenuList error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve menu list.' });
  }
};

/**
 * GET /api/admin/menu/:id
 * Retrieve single dish by ID
 */
export const getAdminMenuItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid dish ID format.' });
      return;
    }

    const dish = await MenuItem.findById(id);
    if (!dish) {
      res.status(404).json({ success: false, message: 'Menu item not found.' });
      return;
    }

    res.status(200).json({ success: true, data: dish.toSafeJSON() });
  } catch (err: any) {
    logger.error('[AdminMenuController] getAdminMenuItemById error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve menu item.' });
  }
};

/**
 * POST /api/admin/menu
 * Create a new dish
 */
export const createAdminMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = createMenuItemSchema.parse(req.body);

    // Verify category exists
    const category = await MenuCategory.findById(validated.categoryId);
    if (!category || category.isArchived) {
      res.status(400).json({ success: false, message: 'Selected menu category is invalid or archived.' });
      return;
    }

    // Generate unique slug
    let baseSlug = slugify(validated.name);
    let candidateSlug = baseSlug;
    let counter = 1;
    while (await MenuItem.findOne({ slug: candidateSlug })) {
      candidateSlug = `${baseSlug}-${counter++}`;
    }

    const priceMinor = toMinorUnits(validated.price);

    const staffUser = (req as any).staff;
    const actorId = staffUser?.id || 'admin';
    const actorEmail = staffUser?.email || 'admin@aurelle.com';
    const actorName = staffUser ? `${staffUser.firstName} ${staffUser.lastName}` : 'Administrator';

    const newDish = await MenuItem.create({
      name: validated.name.trim(),
      slug: candidateSlug,
      categoryId: category._id,
      categoryName: category.name,
      categorySlug: category.slug,
      shortDescription: validated.shortDescription.trim(),
      description: validated.description.trim(),
      priceMinor,
      currency: validated.currency || 'LKR',
      images: validated.images,
      ingredients: validated.ingredients,
      allergens: validated.allergens,
      dietaryTags: validated.dietaryTags,
      spiceLevel: validated.spiceLevel || 'None',
      preparationTimeMinutes: validated.preparationTimeMinutes,
      isAvailable: validated.isAvailable,
      isFeatured: validated.isFeatured,
      publicationStatus: validated.publicationStatus,
      displayOrder: validated.displayOrder,
      locationIds: validated.locationIds,
      createdBy: actorId,
      publishedAt: validated.publicationStatus === PublicationStatus.PUBLISHED ? new Date() : null,
    });

    await recordStaffAuditLog({
      actorId,
      actorName,
      actorEmail,
      targetStaffId: newDish._id.toString(),
      targetStaffName: newDish.name,
      targetStaffEmail: newDish.slug,
      action: 'MENU_ITEM_CREATED',
      details: `Created new dish "${newDish.name}" with status ${newDish.publicationStatus} (LKR ${(newDish.priceMinor / 100).toLocaleString()})`,
      metadata: { dishId: newDish._id.toString(), priceMinor: newDish.priceMinor },
      locationId: validated.locationIds[0] || 'loc-colombo-main',
      ipAddress: req.ip,
    });

    notifyMenuChanged('menu:updated', { action: 'created', dishId: newDish._id.toString() });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully.',
      data: newDish.toSafeJSON(),
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error' });
      return;
    }
    logger.error('[AdminMenuController] createAdminMenuItem error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create menu item.' });
  }
};

/**
 * PATCH /api/admin/menu/:id
 * Update existing dish
 */
export const updateAdminMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid dish ID format.' });
      return;
    }

    const dish = await MenuItem.findById(id);
    if (!dish) {
      res.status(404).json({ success: false, message: 'Menu item not found.' });
      return;
    }

    const validated = updateMenuItemSchema.parse(req.body);

    const staffUser = (req as any).staff;
    const actorId = staffUser?.id || 'admin';
    const actorEmail = staffUser?.email || 'admin@aurelle.com';
    const actorName = staffUser ? `${staffUser.firstName} ${staffUser.lastName}` : 'Administrator';

    // Check if category changed
    if (validated.categoryId && validated.categoryId !== dish.categoryId.toString()) {
      const cat = await MenuCategory.findById(validated.categoryId);
      if (!cat || cat.isArchived) {
        res.status(400).json({ success: false, message: 'Selected menu category is invalid.' });
        return;
      }
      dish.categoryId = cat._id as mongoose.Types.ObjectId;
      dish.categoryName = cat.name;
      dish.categorySlug = cat.slug;
    }

    // Check price change for audit logging
    if (validated.price !== undefined) {
      const newPriceMinor = toMinorUnits(validated.price);
      if (newPriceMinor !== dish.priceMinor) {
        await recordStaffAuditLog({
          actorId,
          actorName,
          actorEmail,
          targetStaffId: dish._id.toString(),
          targetStaffName: dish.name,
          targetStaffEmail: dish.slug,
          action: 'PRICE_CHANGED',
          details: `Price adjusted from LKR ${(dish.priceMinor / 100).toLocaleString()} to LKR ${(newPriceMinor / 100).toLocaleString()}`,
          metadata: { oldPrice: dish.priceMinor, newPrice: newPriceMinor },
          ipAddress: req.ip,
        });
        dish.priceMinor = newPriceMinor;
      }
    }

    // Check availability change
    if (validated.isAvailable !== undefined && validated.isAvailable !== dish.isAvailable) {
      dish.isAvailable = validated.isAvailable;
      await recordStaffAuditLog({
        actorId,
        actorName,
        actorEmail,
        targetStaffId: dish._id.toString(),
        targetStaffName: dish.name,
        targetStaffEmail: dish.slug,
        action: 'AVAILABILITY_CHANGED',
        details: `Dish availability toggled to ${dish.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`,
        metadata: { isAvailable: dish.isAvailable },
        ipAddress: req.ip,
      });
      notifyMenuChanged('menu:availability_changed', { dishId: dish._id.toString(), isAvailable: dish.isAvailable });
    }

    // Update remaining properties
    if (validated.name && validated.name !== dish.name) {
      dish.name = validated.name.trim();
    }
    if (validated.shortDescription !== undefined) dish.shortDescription = validated.shortDescription.trim();
    if (validated.description !== undefined) dish.description = validated.description.trim();
    if (validated.images !== undefined) dish.images = validated.images;
    if (validated.ingredients !== undefined) dish.ingredients = validated.ingredients;
    if (validated.allergens !== undefined) dish.allergens = validated.allergens;
    if (validated.dietaryTags !== undefined) dish.dietaryTags = validated.dietaryTags;
    if (validated.spiceLevel !== undefined) dish.spiceLevel = validated.spiceLevel;
    if (validated.preparationTimeMinutes !== undefined) dish.preparationTimeMinutes = validated.preparationTimeMinutes;
    if (validated.isFeatured !== undefined) dish.isFeatured = validated.isFeatured;
    if (validated.displayOrder !== undefined) dish.displayOrder = validated.displayOrder;
    if (validated.locationIds !== undefined) dish.locationIds = validated.locationIds;
    if (validated.publicationStatus !== undefined) {
      dish.publicationStatus = validated.publicationStatus;
      if (dish.publicationStatus === PublicationStatus.PUBLISHED && !dish.publishedAt) {
        dish.publishedAt = new Date();
      }
    }

    dish.updatedBy = actorId;
    await dish.save();

    await recordStaffAuditLog({
      actorId,
      actorName,
      actorEmail,
      targetStaffId: dish._id.toString(),
      targetStaffName: dish.name,
      targetStaffEmail: dish.slug,
      action: 'MENU_ITEM_UPDATED',
      details: `Updated details for dish "${dish.name}"`,
      ipAddress: req.ip,
    });

    notifyMenuChanged('menu:updated', { action: 'updated', dishId: dish._id.toString() });

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully.',
      data: dish.toSafeJSON(),
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error' });
      return;
    }
    logger.error('[AdminMenuController] updateAdminMenuItem error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to update menu item.' });
  }
};

/**
 * POST /api/admin/menu/:id/publish
 */
export const publishAdminMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const dish = await MenuItem.findById(id);
    if (!dish) {
      res.status(404).json({ success: false, message: 'Menu item not found.' });
      return;
    }

    if (!dish.name || !dish.description || dish.priceMinor <= 0) {
      res.status(400).json({ success: false, message: 'Cannot publish dish without name, description, and valid price.' });
      return;
    }

    dish.publicationStatus = PublicationStatus.PUBLISHED;
    dish.publishedAt = new Date();
    await dish.save();

    const staffUser = (req as any).staff;
    await recordStaffAuditLog({
      actorId: staffUser?.id || 'admin',
      actorName: staffUser ? `${staffUser.firstName} ${staffUser.lastName}` : 'Administrator',
      actorEmail: staffUser?.email || 'admin@aurelle.com',
      targetStaffId: dish._id.toString(),
      targetStaffName: dish.name,
      targetStaffEmail: dish.slug,
      action: 'MENU_ITEM_PUBLISHED',
      details: `Published dish "${dish.name}" to public guest menus`,
      ipAddress: req.ip,
    });

    notifyMenuChanged('menu:updated', { action: 'published', dishId: dish._id.toString() });

    res.status(200).json({ success: true, message: 'Dish published successfully.', data: dish.toSafeJSON() });
  } catch (err: any) {
    logger.error('[AdminMenuController] publishAdminMenuItem error:', err);
    res.status(500).json({ success: false, message: 'Failed to publish menu item.' });
  }
};

/**
 * POST /api/admin/menu/:id/unpublish
 */
export const unpublishAdminMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const dish = await MenuItem.findById(id);
    if (!dish) {
      res.status(404).json({ success: false, message: 'Menu item not found.' });
      return;
    }

    dish.publicationStatus = PublicationStatus.DRAFT;
    await dish.save();

    const staffUser = (req as any).staff;
    await recordStaffAuditLog({
      actorId: staffUser?.id || 'admin',
      actorName: staffUser ? `${staffUser.firstName} ${staffUser.lastName}` : 'Administrator',
      actorEmail: staffUser?.email || 'admin@aurelle.com',
      targetStaffId: dish._id.toString(),
      targetStaffName: dish.name,
      targetStaffEmail: dish.slug,
      action: 'MENU_ITEM_UNPUBLISHED',
      details: `Unpublished dish "${dish.name}" (reverted to DRAFT)`,
      ipAddress: req.ip,
    });

    notifyMenuChanged('menu:updated', { action: 'unpublished', dishId: dish._id.toString() });

    res.status(200).json({ success: true, message: 'Dish unpublished and moved to draft.', data: dish.toSafeJSON() });
  } catch (err: any) {
    logger.error('[AdminMenuController] unpublishAdminMenuItem error:', err);
    res.status(500).json({ success: false, message: 'Failed to unpublish menu item.' });
  }
};

/**
 * POST /api/admin/menu/:id/archive
 */
export const archiveAdminMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const dish = await MenuItem.findById(id);
    if (!dish) {
      res.status(404).json({ success: false, message: 'Menu item not found.' });
      return;
    }

    dish.publicationStatus = PublicationStatus.ARCHIVED;
    dish.archivedAt = new Date();
    await dish.save();

    const staffUser = (req as any).staff;
    await recordStaffAuditLog({
      actorId: staffUser?.id || 'admin',
      actorName: staffUser ? `${staffUser.firstName} ${staffUser.lastName}` : 'Administrator',
      actorEmail: staffUser?.email || 'admin@aurelle.com',
      targetStaffId: dish._id.toString(),
      targetStaffName: dish.name,
      targetStaffEmail: dish.slug,
      action: 'MENU_ITEM_ARCHIVED',
      details: `Safely archived dish "${dish.name}"`,
      ipAddress: req.ip,
    });

    notifyMenuChanged('menu:updated', { action: 'archived', dishId: dish._id.toString() });

    res.status(200).json({ success: true, message: 'Dish archived successfully.', data: dish.toSafeJSON() });
  } catch (err: any) {
    logger.error('[AdminMenuController] archiveAdminMenuItem error:', err);
    res.status(500).json({ success: false, message: 'Failed to archive menu item.' });
  }
};

/**
 * POST /api/admin/menu/:id/duplicate
 */
export const duplicateAdminMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const dish = await MenuItem.findById(id);
    if (!dish) {
      res.status(404).json({ success: false, message: 'Menu item not found.' });
      return;
    }

    let baseSlug = `${dish.slug}-copy`;
    let candidateSlug = baseSlug;
    let counter = 1;
    while (await MenuItem.findOne({ slug: candidateSlug })) {
      candidateSlug = `${baseSlug}-${counter++}`;
    }

    const staffUser = (req as any).staff;
    const actorId = staffUser?.id || 'admin';

    const duplicate = await MenuItem.create({
      name: `${dish.name} (Copy)`,
      slug: candidateSlug,
      categoryId: dish.categoryId,
      categoryName: dish.categoryName,
      categorySlug: dish.categorySlug,
      shortDescription: dish.shortDescription,
      description: dish.description,
      priceMinor: dish.priceMinor,
      currency: dish.currency,
      images: dish.images,
      ingredients: dish.ingredients,
      allergens: dish.allergens,
      dietaryTags: dish.dietaryTags,
      spiceLevel: dish.spiceLevel,
      preparationTimeMinutes: dish.preparationTimeMinutes,
      isAvailable: dish.isAvailable,
      isFeatured: false,
      publicationStatus: PublicationStatus.DRAFT,
      displayOrder: dish.displayOrder + 1,
      locationIds: dish.locationIds,
      createdBy: actorId,
    });

    await recordStaffAuditLog({
      actorId,
      actorName: staffUser ? `${staffUser.firstName} ${staffUser.lastName}` : 'Administrator',
      actorEmail: staffUser?.email || 'admin@aurelle.com',
      targetStaffId: duplicate._id.toString(),
      targetStaffName: duplicate.name,
      targetStaffEmail: duplicate.slug,
      action: 'MENU_ITEM_DUPLICATED',
      details: `Duplicated dish from "${dish.name}" to create "${duplicate.name}" as DRAFT`,
      ipAddress: req.ip,
    });

    notifyMenuChanged('menu:updated', { action: 'duplicated', dishId: duplicate._id.toString() });

    res.status(201).json({
      success: true,
      message: 'Dish duplicated successfully as draft.',
      data: duplicate.toSafeJSON(),
    });
  } catch (err: any) {
    logger.error('[AdminMenuController] duplicateAdminMenuItem error:', err);
    res.status(500).json({ success: false, message: 'Failed to duplicate menu item.' });
  }
};

/**
 * POST /api/admin/menu/images
 * Upload dish image
 */
export const uploadMenuImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image, filename } = uploadMenuImageSchema.parse(req.body);

    // If already an absolute HTTP/HTTPS URL, return directly
    if (image.startsWith('http://') || image.startsWith('https://')) {
      res.status(200).json({
        success: true,
        data: { url: image, mimeType: 'image/external' },
      });
      return;
    }

    const result = await storeMenuImage(image, filename);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    logger.error('[AdminMenuController] uploadMenuImage error:', err);
    res.status(400).json({ success: false, message: err.message || 'Image upload failed.' });
  }
};

/**
 * GET /api/admin/menu/categories
 */
export const getAdminCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await MenuCategory.find().sort({ displayOrder: 1, name: 1 });
    res.status(200).json({
      success: true,
      data: categories.map((c) => c.toSafeJSON()),
    });
  } catch (err: any) {
    logger.error('[AdminMenuController] getAdminCategories error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
};

/**
 * POST /api/admin/menu/categories
 */
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = createCategorySchema.parse(req.body);
    const slug = validated.slug ? slugify(validated.slug) : slugify(validated.name);

    const existing = await MenuCategory.findOne({ slug });
    if (existing) {
      res.status(409).json({ success: false, message: 'Category slug already exists.' });
      return;
    }

    const cat = await MenuCategory.create({
      name: validated.name.trim(),
      slug,
      description: validated.description || '',
      image: validated.image || '',
      displayOrder: validated.displayOrder,
      isVisible: validated.isVisible,
      locationIds: validated.locationIds,
    });

    const staffUser = (req as any).staff;
    await recordStaffAuditLog({
      actorId: staffUser?.id || 'admin',
      actorName: staffUser ? `${staffUser.firstName} ${staffUser.lastName}` : 'Administrator',
      actorEmail: staffUser?.email || 'admin@aurelle.com',
      targetStaffId: cat._id.toString(),
      targetStaffName: cat.name,
      targetStaffEmail: cat.slug,
      action: 'CATEGORY_CREATED',
      details: `Created menu category "${cat.name}"`,
      ipAddress: req.ip,
    });

    notifyMenuChanged('menu:updated', { action: 'category_created', categoryId: cat._id.toString() });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: cat.toSafeJSON(),
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, message: err.errors[0]?.message || 'Validation error' });
      return;
    }
    logger.error('[AdminMenuController] createCategory error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create category.' });
  }
};

/**
 * PATCH /api/admin/menu/categories/:id
 */
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cat = await MenuCategory.findById(id);
    if (!cat) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    const validated = updateCategorySchema.parse(req.body);

    if (validated.name) cat.name = validated.name.trim();
    if (validated.description !== undefined) cat.description = validated.description;
    if (validated.image !== undefined) cat.image = validated.image;
    if (validated.displayOrder !== undefined) cat.displayOrder = validated.displayOrder;
    if (validated.isVisible !== undefined) cat.isVisible = validated.isVisible;
    if (validated.locationIds !== undefined) cat.locationIds = validated.locationIds;

    await cat.save();

    // Sync updated category name to dishes
    if (validated.name) {
      await MenuItem.updateMany(
        { categoryId: cat._id },
        { $set: { categoryName: cat.name } }
      );
    }

    const staffUser = (req as any).staff;
    await recordStaffAuditLog({
      actorId: staffUser?.id || 'admin',
      actorName: staffUser ? `${staffUser.firstName} ${staffUser.lastName}` : 'Administrator',
      actorEmail: staffUser?.email || 'admin@aurelle.com',
      targetStaffId: cat._id.toString(),
      targetStaffName: cat.name,
      targetStaffEmail: cat.slug,
      action: 'CATEGORY_UPDATED',
      details: `Updated category "${cat.name}"`,
      ipAddress: req.ip,
    });

    notifyMenuChanged('menu:updated', { action: 'category_updated', categoryId: cat._id.toString() });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: cat.toSafeJSON(),
    });
  } catch (err: any) {
    logger.error('[AdminMenuController] updateCategory error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to update category.' });
  }
};

/**
 * POST /api/admin/menu/categories/:id/archive
 */
export const archiveCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cat = await MenuCategory.findById(id);
    if (!cat) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    cat.isArchived = true;
    cat.isVisible = false;
    await cat.save();

    const staffUser = (req as any).staff;
    await recordStaffAuditLog({
      actorId: staffUser?.id || 'admin',
      actorName: staffUser ? `${staffUser.firstName} ${staffUser.lastName}` : 'Administrator',
      actorEmail: staffUser?.email || 'admin@aurelle.com',
      targetStaffId: cat._id.toString(),
      targetStaffName: cat.name,
      targetStaffEmail: cat.slug,
      action: 'CATEGORY_ARCHIVED',
      details: `Safely archived category "${cat.name}". Preserved associated dishes.`,
      ipAddress: req.ip,
    });

    notifyMenuChanged('menu:updated', { action: 'category_archived', categoryId: cat._id.toString() });

    res.status(200).json({
      success: true,
      message: 'Category archived successfully. Dishes remain safely preserved.',
      data: cat.toSafeJSON(),
    });
  } catch (err: any) {
    logger.error('[AdminMenuController] archiveCategory error:', err);
    res.status(500).json({ success: false, message: 'Failed to archive category.' });
  }
};
