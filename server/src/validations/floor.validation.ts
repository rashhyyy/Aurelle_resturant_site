import { z } from 'zod';
import {
  ServiceRequestType,
  ServiceRequestPriority,
  ServiceRequestStatus,
} from '../types/floor';

const VALID_LOCATION_IDS = ['loc-colombo-main', 'loc-kandy-vip'];

export const floorIdParamSchema = z.object({
  id: z.string().min(1, 'Target ID is required'),
});

export const floorLocationQuerySchema = z.object({
  locationId: z.string().refine((val) => VALID_LOCATION_IDS.includes(val), {
    message: 'Invalid restaurant location ID.',
  }),
});

export const updateLayoutBodySchema = z.object({
  locationId: z.string().refine((val) => VALID_LOCATION_IDS.includes(val), {
    message: 'Invalid restaurant location ID.',
  }),
  layout: z.array(
    z.object({
      tableId: z.string().min(1, 'tableId is required'),
      positionX: z.number().min(0).max(100),
      positionY: z.number().min(0).max(100),
      width: z.number().min(2).max(100),
      height: z.number().min(2).max(100),
      rotation: z.number().optional().default(0),
      shape: z.enum(['RECTANGLE', 'ROUND', 'SQUARE', 'BOOTH']).optional().default('RECTANGLE'),
      sectionId: z.string().optional(),
      displayOrder: z.number().optional(),
    })
  ).min(1, 'At least one table layout entry is required'),
});

export const assignTableStaffBodySchema = z.object({
  staffId: z.string().nullable().optional(),
});

export const createServiceRequestBodySchema = z.object({
  locationId: z.string().refine((val) => VALID_LOCATION_IDS.includes(val), {
    message: 'Invalid restaurant location ID.',
  }),
  tableId: z.string().optional(),
  tableNumber: z.string().optional(),
  diningSessionId: z.string().optional(),
  requestType: z.nativeEnum(ServiceRequestType),
  description: z.string().min(2, 'Description must be at least 2 characters').max(300),
  priority: z.nativeEnum(ServiceRequestPriority).optional().default(ServiceRequestPriority.NORMAL),
});

export const updateServiceRequestBodySchema = z.object({
  status: z.nativeEnum(ServiceRequestStatus),
  notes: z.string().max(300).optional(),
});

// Composite schema objects for validate() middleware
export const updateLayoutValidation = {
  body: updateLayoutBodySchema,
};

export const assignTableStaffValidation = {
  params: floorIdParamSchema,
  body: assignTableStaffBodySchema,
};

export const createServiceRequestValidation = {
  body: createServiceRequestBodySchema,
};

export const updateServiceRequestValidation = {
  params: floorIdParamSchema,
  body: updateServiceRequestBodySchema,
};

export const floorIdParamValidation = {
  params: floorIdParamSchema,
};
