import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { createSessionMiddleware } from './config/session';
import { apiRoutes } from './routes';
import { requestLogger } from './middleware/logging.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { errorHandler } from './middleware/error.middleware';

/**
 * Creates and configures the Express application.
 */
export const createApp = (): Application => {
  const app = express();

  // Trust reverse proxy (essential on Render, Railway, etc. for HTTPS session cookies)
  app.set('trust proxy', 1);

  // 1. Security Headers via Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      hidePoweredBy: true,
    })
  );

  // 2. Strict CORS Configuration (Permits approved origins and all Vercel deployments)
  const allowedOrigins = [env.CLIENT_ORIGIN];
  if (env.CLIENT_URL && !allowedOrigins.includes(env.CLIENT_URL)) {
    allowedOrigins.push(env.CLIENT_URL);
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        const originClean = origin.replace(/\/+$/, '');
        const isAllowed =
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes(originClean) ||
          env.NODE_ENV === 'development' ||
          /\.vercel\.app$/.test(originClean);

        if (isAllowed) {
          return callback(null, true);
        }
        return callback(new Error(`CORS policy violation: origin ${origin} is not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-XSRF-Token'],
      maxAge: 86400, // 24 hours preflight cache
    })
  );

  // 3. Request Body Parsers with Controlled Size Limits (10mb to support high-res menu images)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 4. Static Serving for Uploaded Menu Media with caching
  app.use(
    '/uploads',
    express.static(path.join(process.cwd(), 'uploads'), {
      maxAge: '7d',
      immutable: true,
    })
  );

  // 5. Request Logging with Sensitive Data Redaction
  app.use(requestLogger);

  // 6. Secure Session Middleware backed by MongoStore
  app.use(createSessionMiddleware());

  // 7. Mount Primary API Router under /api
  app.use('/api', apiRoutes);

  // 7. 404 Route Handler for undefined endpoints
  app.use(notFoundHandler);

  // 8. Centralized Global Error Handler
  app.use(errorHandler);

  return app;
};
