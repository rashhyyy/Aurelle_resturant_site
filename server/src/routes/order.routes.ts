import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  trackOrderByReference,
} from '../controllers/customerOrder.controller';

const router = Router();

// Public / Guest / Customer order placement
router.post('/', createOrder);

// Real-time lookup / tracking by reference
router.get('/track/:reference', trackOrderByReference);

// Authenticated customer order history and management
router.get('/my', getMyOrders);
router.get('/my/:id', getMyOrderById);
router.post('/my/:id/cancel', cancelMyOrder);

export const orderRoutes = router;
