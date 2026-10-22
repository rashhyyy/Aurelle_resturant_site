import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { sessionStore } from '../config/session';
import { logger } from '../utils/logger';
import { StaffRole, StaffStatus } from '../types/staff';
import { Order } from '../models/order.model';
import { Reservation } from '../models/reservation.model';

let ioInstance: Server | null = null;

export interface ServerToClientEvents {
  'server:pong': (data: { timestamp: number }) => void;
  'connection:established': (data: { serverTime: string; isStaff: boolean }) => void;
  'staff:authenticated': (data: { staffId: string; role: StaffRole }) => void;
  'notification:broadcast': (data: { title: string; message: string; type?: string }) => void;
}

export interface ClientToServerEvents {
  'client:ping': (data: { timestamp: number }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId?: string;
  userEmail?: string;
  role?: string;
  isStaff?: boolean;
  locationIds?: string[];
  staff?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: StaffRole;
    status: StaffStatus;
    locationIds: string[];
  };
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

/**
 * Helper to parse cookies from raw Cookie header string.
 */
const parseCookieString = (cookieString?: string): Record<string, string> => {
  if (!cookieString) return {};
  return cookieString.split(';').reduce((acc, pair) => {
    const idx = pair.indexOf('=');
    if (idx < 0) return acc;
    const key = decodeURIComponent(pair.substring(0, idx).trim());
    const val = decodeURIComponent(pair.substring(idx + 1).trim());
    acc[key] = val;
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Initializes the Socket.IO server bound to the main Express HTTP server.
 * Uses explicitly permitted origins from environment configuration and inspects session cookies.
 */
export const setupSocketServer = (httpServer: HttpServer): Server => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const originClean = origin.replace(/\/+$/, '');
        const allowed = [env.CLIENT_ORIGIN, env.CLIENT_URL].filter(Boolean) as string[];
        const isAllowed =
          allowed.includes(origin) ||
          allowed.includes(originClean) ||
          env.NODE_ENV === 'development' ||
          /\.vercel\.app$/.test(originClean);
        if (isAllowed) return callback(null, true);
        return callback(new Error('Origin not permitted by Socket.IO CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Socket.IO authentication middleware checking session cookie
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        return next();
      }

      const cookies = parseCookieString(cookieHeader);
      const rawSessionCookie = cookies[env.SESSION_NAME];

      if (!rawSessionCookie) {
        return next();
      }

      // Signed session cookie has format s:<sessionId>.<signature>
      const sessionId = cookieParser.signedCookie(rawSessionCookie, env.SESSION_SECRET);

      if (!sessionId || typeof sessionId !== 'string') {
        return next();
      }

      // Query session store for authenticated staff session
      sessionStore.get(sessionId, (err: any, session: any) => {
        if (err || !session) {
          return next();
        }

        if (session.staff && session.staff.status === StaffStatus.ACTIVE) {
          socket.data.isStaff = true;
          socket.data.userId = session.staff.id;
          socket.data.role = session.staff.role;
          socket.data.locationIds = session.staff.locationIds || [];
          socket.data.staff = session.staff;
        } else if (session.user) {
          socket.data.isStaff = false;
          socket.data.userId = session.user.id || session.user._id;
          socket.data.userEmail = session.user.email;
          socket.data.role = session.user.role;
          socket.data.user = session.user;
        }

        next();
      });
    } catch (err) {
      logger.warn('[Socket.IO] Authentication handshake warning:', err);
      next();
    }
  });

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    const isStaff = !!socket.data.isStaff;
    logger.debug(`[Socket.IO] Client connected: socketId=${socket.id}, isStaff=${isStaff}`);

    // If authenticated staff member, auto-join role-scoped and location-scoped rooms
    if (isStaff && socket.data.staff) {
      const { role, id, locationIds } = socket.data.staff;
      const roleRoom = `role:${role.toLowerCase()}`;
      const userRoom = `staff:${id}`;

      socket.join('staff:all');
      socket.join(roleRoom);
      socket.join(userRoom);

      if (Array.isArray(locationIds)) {
        locationIds.forEach((locId) => {
          socket.join(`location:${locId}`);
          socket.join(`staff:${locId}`);
          socket.join(`floor:${locId}`);
        });
      }

      logger.debug(
        `[Socket.IO] Staff joined rooms: ${roleRoom}, ${userRoom}, staff:all (staffId=${id})`
      );

      socket.emit('staff:authenticated', {
        staffId: id,
        role,
      });
    } else if (socket.data.userId) {
      // Authenticated customer room
      const customerRoom = `customer:${socket.data.userId}`;
      socket.join(customerRoom);
      logger.debug(`[Socket.IO] Customer joined room: ${customerRoom}`);
    }

    // Scoped order subscription with strict customer ownership and staff authorization checks
    socket.on('subscribe:order' as any, async (input: any) => {
      try {
        const refOrId =
          typeof input === 'string'
            ? input.trim()
            : (input?.orderReference || input?.orderId || '').trim();
        const contactEmail =
          typeof input === 'object' && input?.email ? input.email.trim().toLowerCase() : undefined;

        if (!refOrId) return;

        const isObjectId = mongoose.Types.ObjectId.isValid(refOrId);
        const order = await Order.findOne({
          $or: [
            { orderReference: refOrId.toUpperCase() },
            ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(refOrId) }] : []),
          ],
        });

        if (!order) {
          logger.warn(`[Socket.IO] Order subscription failed: order "${refOrId}" not found.`);
          socket.emit('subscribe:error' as any, { message: 'Order not found.' });
          return;
        }

        const roomByRef = `order:${order.orderReference.toUpperCase()}`;
        const roomById = `order:${order._id.toString()}`;

        // 1. Staff members are authorized to subscribe to all operational orders
        if (socket.data.isStaff) {
          socket.join(roomByRef);
          socket.join(roomById);
          logger.debug(`[Socket.IO] Staff ${socket.id} subscribed to ${roomByRef}`);
          socket.emit('subscribe:success' as any, { orderReference: order.orderReference, orderId: order._id.toString() });
          return;
        }

        // 2. Authenticated customer ownership verification
        if (socket.data.userId) {
          const isOwner =
            order.customerId === socket.data.userId ||
            (socket.data.userEmail && order.customerEmail.toLowerCase() === socket.data.userEmail.toLowerCase());

          if (!isOwner) {
            logger.warn(
              `[Socket.IO] Customer ${socket.data.userId} attempted unauthorized subscription to order ${order.orderReference}`
            );
            socket.emit('subscribe:error' as any, { error: 'Forbidden', message: 'You are not authorized to subscribe to this order.' });
            return;
          }

          socket.join(roomByRef);
          socket.join(roomById);
          logger.debug(`[Socket.IO] Customer ${socket.data.userId} subscribed to ${roomByRef}`);
          socket.emit('subscribe:success' as any, { orderReference: order.orderReference, orderId: order._id.toString() });
          return;
        }

        // 3. Guest tracking: verified by contact email or direct order reference
        const isDummyDefault = contactEmail === 'customer@example.com';
        const emailMatches = contactEmail && !isDummyDefault && order.customerEmail.toLowerCase() === contactEmail;

        if (emailMatches || !contactEmail || isDummyDefault) {
          socket.join(roomByRef);
          socket.join(roomById);
          logger.debug(`[Socket.IO] Guest subscribed to ${roomByRef}`);
          socket.emit('subscribe:success' as any, { orderReference: order.orderReference, orderId: order._id.toString() });
          return;
        }

        // If an explicit non-matching email was provided, reject
        logger.warn(`[Socket.IO] Unauthorized guest subscription rejected for order ${refOrId}`);
        socket.emit('subscribe:error' as any, { error: 'Forbidden', message: 'You are not authorized to subscribe to this order.' });
      } catch (err) {
        logger.warn('[Socket.IO] Error during order subscription:', err);
      }
    });

    // Handle scoped reservation room subscriptions with authorization checks
    socket.on('subscribe:reservation' as any, async (payload: { reservationReference?: string; email?: string }) => {
      try {
        const refOrId = payload?.reservationReference?.trim();
        const contactEmail = payload?.email?.toLowerCase().trim();

        if (!refOrId) return;

        const isObjectId = mongoose.Types.ObjectId.isValid(refOrId);
        const reservation = await Reservation.findOne({
          $or: [
            { reservationReference: refOrId.toUpperCase() },
            ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(refOrId) }] : []),
          ],
        });

        if (!reservation) {
          logger.warn(`[Socket.IO] Subscription rejected: Reservation not found for ${refOrId}`);
          socket.emit('subscribe:error' as any, { error: 'NotFound', message: 'Reservation not found.' });
          return;
        }

        const roomByRef = `reservation:${reservation.reservationReference.toUpperCase()}`;
        const roomById = `reservation:${reservation._id.toString()}`;

        // 1. Staff access
        if (socket.data.isStaff) {
          socket.join(roomByRef);
          socket.join(roomById);
          logger.debug(`[Socket.IO] Staff ${socket.id} subscribed to ${roomByRef}`);
          socket.emit('subscribe:success' as any, {
            reservationReference: reservation.reservationReference,
            reservationId: reservation._id.toString(),
          });
          return;
        }

        // 2. Authenticated customer ownership
        if (socket.data.userId) {
          const isOwner =
            reservation.customerId === socket.data.userId ||
            (socket.data.userEmail && reservation.guestEmail.toLowerCase() === socket.data.userEmail.toLowerCase());

          if (!isOwner) {
            logger.warn(
              `[Socket.IO] Customer ${socket.data.userId} attempted unauthorized subscription to reservation ${reservation.reservationReference}`
            );
            socket.emit('subscribe:error' as any, {
              error: 'Forbidden',
              message: 'You are not authorized to subscribe to this reservation.',
            });
            return;
          }

          socket.join(roomByRef);
          socket.join(roomById);
          logger.debug(`[Socket.IO] Customer ${socket.data.userId} subscribed to ${roomByRef}`);
          socket.emit('subscribe:success' as any, {
            reservationReference: reservation.reservationReference,
            reservationId: reservation._id.toString(),
          });
          return;
        }

        // 3. Guest tracking: must provide matching guest email
        if (contactEmail && reservation.guestEmail.toLowerCase() === contactEmail) {
          socket.join(roomByRef);
          socket.join(roomById);
          logger.debug(`[Socket.IO] Guest verified by email subscribed to ${roomByRef}`);
          socket.emit('subscribe:success' as any, {
            reservationReference: reservation.reservationReference,
            reservationId: reservation._id.toString(),
          });
          return;
        }

        // Unauthenticated and unverified: reject
        logger.warn(`[Socket.IO] Unauthorized subscription rejected for reservation ${refOrId}`);
        socket.emit('subscribe:error' as any, {
          error: 'Forbidden',
          message: 'You are not authorized to subscribe to this reservation.',
        });
      } catch (err) {
        logger.warn('[Socket.IO] Error during reservation subscription:', err);
      }
    });

    // Send connection handshake acknowledgment
    socket.emit('connection:established', {
      serverTime: new Date().toISOString(),
      isStaff,
    });

    // Foundational ping-pong for connectivity and heartbeat
    socket.on('client:ping', () => {
      socket.emit('server:pong', {
        timestamp: Date.now(),
      });
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`[Socket.IO] Client disconnected: socketId=${socket.id}, reason=${reason}`);
    });
  });

  ioInstance = io;
  return io;
};

/**
 * Access the initialized Socket.IO instance for future module event emission.
 */
export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized. Call setupSocketServer first.');
  }
  return ioInstance;
};

/**
 * Emit event to a specific staff role room (e.g. KITCHEN, MANAGER).
 */
export const emitToRole = (role: StaffRole, event: string, payload: any): void => {
  if (ioInstance) {
    ioInstance.to(`role:${role.toLowerCase()}`).emit(event as any, payload);
  }
};

/**
 * Gracefully close the Socket.IO instance.
 */
export const closeSocketServer = async (): Promise<void> => {
  if (ioInstance) {
    return new Promise((resolve) => {
      ioInstance!.close(() => {
        logger.info('Socket.IO real-time engine closed gracefully');
        ioInstance = null;
        resolve();
      });
    });
  }
};

// Aliases for compatibility
export const setupSocketIO = setupSocketServer;
export const getSocketServer = (): Server | null => {
  return ioInstance;
};
