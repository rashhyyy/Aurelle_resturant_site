import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env';
import { logger, maskMongoUri } from '../utils/logger';

// Configure public DNS servers (Google / Cloudflare) to ensure MongoDB Atlas SRV records
// resolve properly in environments where local router DNS does not support SRV lookups
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if custom DNS cannot be set
}

let isConnected = false;

/**
 * Connect to MongoDB Atlas / local MongoDB using Mongoose.
 */
export const connectDatabase = async (): Promise<boolean> => {
  const safeUri = maskMongoUri(env.MONGODB_URI);

  try {
    logger.info(`Connecting to MongoDB at: ${safeUri}`);

    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 30000,
    });

    isConnected = conn.connection.readyState === 1;

    if (isConnected) {
      logger.info(
        `MongoDB connected successfully: host=${conn.connection.host}, database=${conn.connection.name}`
      );
    }

    // Attach lifecycle event handlers
    mongoose.connection.on('error', (err) => {
      isConnected = false;
      logger.error('MongoDB connection error:', err.message || err);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('MongoDB reconnected');
    });

    return isConnected;
  } catch (error: unknown) {
    isConnected = false;
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to connect to MongoDB (${safeUri}): ${errorMessage}`);

    // In production, exit immediately if database connection cannot be established
    if (env.NODE_ENV === 'production') {
      logger.error('Production database connection failed. Exiting process.');
      process.exit(1);
    }

    return false;
  }
};

/**
 * Check whether database is actively connected and ready.
 */
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

/**
 * Gracefully close database connection.
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close();
      isConnected = false;
      logger.info('MongoDB connection closed gracefully');
    } catch (err) {
      logger.error('Error closing MongoDB connection:', err);
    }
  }
};

// Aliases for backwards compatibility
export const connectDB = connectDatabase;
