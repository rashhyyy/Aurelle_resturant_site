import { Router } from 'express';
import {
  getPublicRoomsHandler,
  getPublicRoomBySlugHandler,
  checkRoomAvailabilityHandler,
  getPublicPackagesHandler,
  createCustomerBookingHandler,
  getBookingByRefHandler,
  modifyBookingHandler,
  cancelBookingHandler,
  createCustomerInquiryHandler,
  getProposalByIdHandler,
  acceptProposalHandler,
  declineProposalHandler,
  getCustomerHistoryHandler,
} from '../controllers/vip.controller';

const router = Router();

// Public Rooms & Packages
router.get('/rooms', getPublicRoomsHandler);
router.get('/availability', checkRoomAvailabilityHandler);
router.get('/rooms/:slug', getPublicRoomBySlugHandler);
router.get('/rooms/:slug/availability', checkRoomAvailabilityHandler);
router.get('/packages', getPublicPackagesHandler);

// Customer Bookings
router.post('/bookings', createCustomerBookingHandler);
router.get('/bookings/:ref', getBookingByRefHandler);
router.patch('/bookings/:ref', modifyBookingHandler);
router.post('/bookings/:ref/cancel', cancelBookingHandler);

// Customer Event Inquiries
router.post('/inquiries', createCustomerInquiryHandler);

// Customer Proposals
router.get('/proposals/:id', getProposalByIdHandler);
router.post('/proposals/:id/accept', acceptProposalHandler);
router.post('/proposals/:id/decline', declineProposalHandler);

// Customer History
router.get('/customer/history', getCustomerHistoryHandler);

export const vipRoutes = router;
export default router;
