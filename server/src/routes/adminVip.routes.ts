import { Router } from 'express';
import {
  requireStaffAuth,
  requireStaffRole,
  requireLocationAccess,
} from '../middleware/staffAuth.middleware';
import { StaffRole } from '../types/staff';
import {
  getVIPOverviewHandler,
  getAdminRoomsHandler,
  createAdminRoomHandler,
  updateAdminRoomHandler,
  deleteAdminRoomHandler,
  uploadRoomImageHandler,
  getAdminBookingsHandler,
  checkInBookingHandler,
  cancelBookingAdminHandler,
  modifyBookingHandler,
  getAdminInquiriesHandler,
  getAdminInquiryDetailHandler,
  updateInquiryStatusHandler,
  createAdminProposalHandler,
  getAdminEventsHandler,
  getAdminPackagesHandler,
  createAdminPackageHandler,
  acceptProposalHandler,
  declineProposalHandler,
} from '../controllers/vip.controller';

const router = Router();

// Protect all admin VIP routes with staff auth & location access
router.use(requireStaffAuth);
router.use(
  requireStaffRole(
    StaffRole.ADMIN,
    StaffRole.MANAGER,
    StaffRole.RECEPTION,
    StaffRole.FLOOR
  )
);
router.use(requireLocationAccess('locationId'));

// Overview Telemetry
router.get('/overview', getVIPOverviewHandler);

// VIP Rooms (Admin & Manager)
router.get('/rooms', getAdminRoomsHandler);
router.post(
  '/rooms',
  requireStaffRole(StaffRole.ADMIN),
  createAdminRoomHandler
);
router.put(
  '/rooms/:id',
  requireStaffRole(StaffRole.ADMIN),
  updateAdminRoomHandler
);
router.patch(
  '/rooms/:id',
  requireStaffRole(StaffRole.ADMIN),
  updateAdminRoomHandler
);
router.delete(
  '/rooms/:id',
  requireStaffRole(StaffRole.ADMIN),
  deleteAdminRoomHandler
);
router.post(
  '/rooms/upload-image',
  requireStaffRole(StaffRole.ADMIN),
  uploadRoomImageHandler
);

// VIP Bookings
router.get('/bookings', getAdminBookingsHandler);
router.patch(
  '/bookings/:ref',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER),
  modifyBookingHandler
);
router.post(
  '/bookings/:ref/check-in',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION),
  checkInBookingHandler
);
router.post(
  '/bookings/:ref/cancel',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER),
  cancelBookingAdminHandler
);

// Event Inquiries
router.get('/inquiries', getAdminInquiriesHandler);
router.get('/inquiries/:id', getAdminInquiryDetailHandler);
router.patch(
  '/inquiries/:id/status',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER),
  updateInquiryStatusHandler
);

// Event Proposals & Confirmed Events
router.post(
  '/proposals',
  requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER),
  createAdminProposalHandler
);
router.post(
  '/proposals/:id/accept',
  acceptProposalHandler
);
router.post(
  '/proposals/:id/decline',
  declineProposalHandler
);
router.get('/events', getAdminEventsHandler);
router.get('/event-bookings', getAdminEventsHandler);

// Dining Packages
router.get('/packages', getAdminPackagesHandler);
router.post(
  '/packages',
  requireStaffRole(StaffRole.ADMIN),
  createAdminPackageHandler
);

export const adminVipRoutes = router;
export default router;
