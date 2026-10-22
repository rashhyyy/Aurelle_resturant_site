import { Router } from 'express';
import {
  getAvailability,
  createReservation,
  getMyReservations,
  getMyReservationById,
  modifyMyReservation,
  cancelMyReservation,
} from '../controllers/customerReservation.controller';

const router = Router();

// Public availability check
router.get('/availability', getAvailability);

// Customer booking creation
router.post('/', createReservation);

// Authenticated customer history and details
router.get('/my', getMyReservations);
router.get('/my/:id', getMyReservationById);
router.patch('/my/:id', modifyMyReservation);
router.post('/my/:id/cancel', cancelMyReservation);

export default router;
