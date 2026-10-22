import { Router } from 'express';
import {
  getPublicMenu,
  getPublicCategories,
  getPublicFeatured,
  getPublicMenuItemBySlug,
} from '../controllers/publicMenu.controller';

const router = Router();

// Public guest menu endpoints
router.get('/', getPublicMenu);
router.get('/categories', getPublicCategories);
router.get('/featured', getPublicFeatured);
router.get('/:slug', getPublicMenuItemBySlug);

export const publicMenuRoutes = router;
