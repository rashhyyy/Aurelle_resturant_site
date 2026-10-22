import { Router } from 'express';
import { register, login, logout, getMe, forgotPassword, updateProfile } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getMe);
router.post('/forgot-password', forgotPassword);
router.put('/profile', requireAuth, updateProfile);

// Example protected route for testing requireAuth
router.get('/protected', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Access granted to secure session resource',
    user: req.session.user,
  });
});

export const authRoutes = router;
