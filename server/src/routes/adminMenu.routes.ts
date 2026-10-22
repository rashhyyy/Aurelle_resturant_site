import { Router } from 'express';
import { requireStaffAuth, requireStaffRole } from '../middleware/staffAuth.middleware';
import { StaffRole } from '../types/staff';
import {
  getAdminMenuSummary,
  getAdminMenuList,
  getAdminMenuItemById,
  createAdminMenuItem,
  updateAdminMenuItem,
  publishAdminMenuItem,
  unpublishAdminMenuItem,
  archiveAdminMenuItem,
  duplicateAdminMenuItem,
  uploadMenuImage,
  getAdminCategories,
  createCategory,
  updateCategory,
  archiveCategory,
} from '../controllers/adminMenu.controller';

const router = Router();

// Protect all admin menu routes with authentication and role authorization
router.use(requireStaffAuth);
router.use(requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER));

// Summary KPI counts
router.get('/summary', getAdminMenuSummary);

// Categories
router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.post('/categories/:id/archive', archiveCategory);

// Image Upload
router.post('/images', uploadMenuImage);

// Dishes CRUD & Workflows
router.get('/', getAdminMenuList);
router.post('/', createAdminMenuItem);
router.get('/:id', getAdminMenuItemById);
router.patch('/:id', updateAdminMenuItem);
router.post('/:id/publish', publishAdminMenuItem);
router.post('/:id/unpublish', unpublishAdminMenuItem);
router.post('/:id/archive', archiveAdminMenuItem);
router.post('/:id/duplicate', duplicateAdminMenuItem);

export const adminMenuRoutes = router;
