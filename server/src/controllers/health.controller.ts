import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { isDatabaseConnected } from '../config/database';

/**
 * Basic Liveness Health Check (GET /api/health)
 * Indicates the API process is alive and responsive.
 */
export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    service: 'aurelle-api',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
};

/**
 * Detailed Readiness Check (GET /api/health/ready)
 * Verifies live connectivity with MongoDB Atlas and critical subsystems.
 * Returns 503 Service Unavailable if database is disconnected.
 */
export const getReadiness = (_req: Request, res: Response): void => {
  const dbConnected = isDatabaseConnected();
  const dbState = mongoose.connection.readyState;

  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const statusString = dbStatusMap[dbState] || 'unknown';

  if (!dbConnected) {
    res.status(503).json({
      status: 'error',
      service: 'aurelle-api',
      message: 'Subsystem readiness check failed: database is disconnected',
      database: {
        status: statusString,
        readyState: dbState,
        connected: false,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    service: 'aurelle-api',
    database: {
      status: statusString,
      readyState: dbState,
      connected: true,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    },
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
};
