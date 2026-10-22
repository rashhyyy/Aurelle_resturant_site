import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

// Reusing Mongoose's connection client ensures that no unhandled orphan MongoClient instances are spawned.
export const sessionStore = MongoStore.create({
  clientPromise: (async () => {
    try {
      const conn = await mongoose.connection.asPromise();
      return conn.getClient() as any;
    } catch (err: any) {
      logger.warn(`[SessionStore] MongoDB client connection unavailable: ${err?.message || err}`);
      // Return a non-crashing promise when offline so unhandled rejection is not triggered
      return new Promise(() => {});
    }
  })(),
  collectionName: 'sessions',
  ttl: env.COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
  autoRemove: 'native',
  touchAfter: 24 * 3600, // Lazy session update every 24 hours
});

// Attach error listener to prevent uncaught EventEmitter errors when database is offline
sessionStore.on('error', (err) => {
  logger.warn(`Session Store Notice (Database offline or reconnecting): ${err?.message || err}`);
});

export const createSessionMiddleware = () => {
  const isProduction = env.NODE_ENV === 'production';

  return session({
    name: env.SESSION_NAME,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: env.COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    },
  });
};
