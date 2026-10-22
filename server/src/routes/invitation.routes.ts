import { Router } from 'express';
import {
  validateInvitationToken,
  acceptStaffInvitation,
} from '../controllers/invitation.controller';
import { invitationLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.use(invitationLimiter);

// 1. Validate invitation token
router.post('/validate', validateInvitationToken);

// 2. Accept invitation and activate account
router.post('/accept', acceptStaffInvitation);

export const invitationRoutes = router;
