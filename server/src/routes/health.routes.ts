import { Router } from 'express';
import { getHealth, getReadiness } from '../controllers/health.controller';

const router = Router();

// GET /api/health -> Liveness check
router.get('/', getHealth);

// GET /api/health/ready -> Readiness check (verifies database)
router.get('/ready', getReadiness);

export const healthRoutes = router;
