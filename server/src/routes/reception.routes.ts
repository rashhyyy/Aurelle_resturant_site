import { Router } from 'express';
import { requireStaffAuth, requireStaffRole, requireLocationAccess } from '../middleware/staffAuth.middleware';
import { validate } from '../middleware/validate.middleware';
import { StaffRole } from '../types/staff';
import {
  checkInReservationSchema,
  assignTableSchema,
  seatReservationSchema,
  noShowReservationSchema,
  walkInSchema,
  waitingListCreateSchema,
  waitingListUpdateSchema,
  waitingListSeatSchema,
  modifyReceptionReservationSchema,
} from '../validations/reception.validation';
import {
  getOverviewHandler,
  getReservationsHandler,
  getReservationByIdHandler,
  checkInHandler,
  assignTableHandler,
  seatHandler,
  markNoShowHandler,
  walkInHandler,
  getTablesAvailabilityHandler,
  getWaitingListHandler,
  addToWaitingListHandler,
  updateWaitingListHandler,
  seatWaitingListHandler,
  modifyReservationHandler,
} from '../controllers/reception.controller';

const router = Router();

// Protect all reception endpoints: Staff Auth + Role-Based Access Control (Admin, Manager, Reception)
router.use(requireStaffAuth);
router.use(requireStaffRole(StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.RECEPTION));
router.use(requireLocationAccess('locationId'));

// Overview & Telemetry
router.get('/overview', getOverviewHandler);

// Table Availability Overview
router.get('/tables/availability', getTablesAvailabilityHandler);

// Today's Reservations Directory
router.get('/reservations', getReservationsHandler);

// Reservation Details & Dossier
router.get('/reservations/:id', getReservationByIdHandler);

// Guest Check-In Action
router.post('/reservations/:id/check-in', validate(checkInReservationSchema), checkInHandler);

// Table Assignment
router.post('/reservations/:id/assign-table', validate(assignTableSchema), assignTableHandler);

// Guest Seating Action
router.post('/reservations/:id/seat', validate(seatReservationSchema), seatHandler);

// No-Show Management
router.post('/reservations/:id/no-show', validate(noShowReservationSchema), markNoShowHandler);

// Reservation Modification
router.patch('/reservations/:id', validate(modifyReceptionReservationSchema), modifyReservationHandler);

// Walk-In Guest Management
router.post('/walk-ins', validate(walkInSchema), walkInHandler);

// Waiting List Operations
router.get('/waiting-list', getWaitingListHandler);
router.post('/waiting-list', validate(waitingListCreateSchema), addToWaitingListHandler);
router.patch('/waiting-list/:id', validate(waitingListUpdateSchema), updateWaitingListHandler);
router.post('/waiting-list/:id/seat', validate(waitingListSeatSchema), seatWaitingListHandler);

export const receptionRoutes = router;
export default router;
