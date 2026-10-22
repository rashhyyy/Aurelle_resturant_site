/**
 * Aurelle Restaurant Management Platform
 * Table & Dining Capacity Types (Stage 9)
 */

export enum TableSection {
  MAIN_DINING = 'MAIN_DINING',
  CHEFS_COUNTER = 'CHEFS_COUNTER',
  OUTDOOR_TERRACE = 'OUTDOOR_TERRACE',
  PRIVATE_DINING = 'PRIVATE_DINING',
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  OCCUPIED = 'OCCUPIED',
  AWAITING_CLEANING = 'AWAITING_CLEANING',
  CLEANING = 'CLEANING',
  UNAVAILABLE = 'UNAVAILABLE',
}

export type TableShape = 'RECTANGLE' | 'ROUND' | 'SQUARE' | 'BOOTH';

export interface ITableLayout {
  floorId?: string;
  sectionId?: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  shape: TableShape;
  displayOrder?: number;
}

export interface ITable {
  tableNumber: string;
  name: string;
  locationId: string;
  capacity: number;
  minPartySize: number;
  section: TableSection;
  status: TableStatus;
  isActive: boolean;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  layout?: ITableLayout | null;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITableSafeJSON {
  id: string;
  tableNumber: string;
  name: string;
  locationId: string;
  capacity: number;
  minPartySize: number;
  section: TableSection;
  status: TableStatus;
  isActive: boolean;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  layout?: ITableLayout | null;
}
