import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import { setupSocketServer, closeSocketServer } from './sockets/socket.server';
import { logger } from './utils/logger';

const startServer = async () => {
  // 1. Establish Database Connection during application startup
  const dbConnected = await connectDatabase();

  if (!dbConnected && env.NODE_ENV === 'production') {
    logger.error('Failed to establish database connection in production environment. Terminating.');
    process.exit(1);
  }

  // 2. Initialize Express Application
  const app = createApp();

  // 3. Create Shared HTTP Server
  const httpServer = http.createServer(app);

  // 4. Mount Socket.IO on the Shared HTTP Server
  setupSocketServer(httpServer);

  // 5. Start Listening on Configured Port
  httpServer.listen(env.PORT, () => {
    logger.info('='.repeat(60));
    logger.info(`✨ Aurelle Backend Server active on port ${env.PORT}`);
    logger.info(`📡 Environment: ${env.NODE_ENV}`);
    logger.info(`🌐 Permitted Client Origin: ${env.CLIENT_ORIGIN}`);
    logger.info(`🔌 Socket.IO Gateway: ws://localhost:${env.PORT}`);
    logger.info(`🩺 Health Check: http://localhost:${env.PORT}/api/health`);
    logger.info(`🔍 Readiness Check: http://localhost:${env.PORT}/api/health/ready`);
    logger.info('='.repeat(60));
  });

  // 6. Graceful Shutdown Coordinator
  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`\nReceived ${signal}. Initiating graceful shutdown...`);

    // Force exit after 10 seconds timeout in case of hanging connections
    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out. Forcefully terminating process.');
      process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    try {
      // 1. Close Socket.IO
      await closeSocketServer();

      // 2. Stop accepting new HTTP requests
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => {
          if (err) return reject(err);
          logger.info('HTTP server closed successfully');
          resolve();
        });
      });

      // 3. Disconnect Mongoose
      await disconnectDatabase();

      logger.info('All subsystems stopped cleanly. Exiting.');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer().catch((err) => {
  logger.error('Fatal bootstrap error during server initialization:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});
