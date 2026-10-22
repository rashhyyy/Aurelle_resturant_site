import { Table, ITableDocument } from '../models/table.model';
import { TableSection, TableStatus, ITableSafeJSON } from '../types/table';
import { logger } from '../utils/logger';

interface DefaultTableDefinition {
  tableNumber: string;
  name: string;
  capacity: number;
  minPartySize: number;
  section: TableSection;
}

const COLOMBO_DEFAULT_TABLES: DefaultTableDefinition[] = [
  // Intimate Two-Tops (Main Dining)
  { tableNumber: 'T01', name: 'Table 1 (Banquette)', capacity: 2, minPartySize: 1, section: TableSection.MAIN_DINING },
  { tableNumber: 'T02', name: 'Table 2 (Banquette)', capacity: 2, minPartySize: 1, section: TableSection.MAIN_DINING },
  { tableNumber: 'T03', name: 'Table 3 (Window Alcove)', capacity: 2, minPartySize: 1, section: TableSection.MAIN_DINING },
  { tableNumber: 'T04', name: 'Table 4 (Window Alcove)', capacity: 2, minPartySize: 1, section: TableSection.MAIN_DINING },
  
  // Standard Four-Tops (Main Dining)
  { tableNumber: 'T05', name: 'Table 5 (Center Hall)', capacity: 4, minPartySize: 2, section: TableSection.MAIN_DINING },
  { tableNumber: 'T06', name: 'Table 6 (Center Hall)', capacity: 4, minPartySize: 2, section: TableSection.MAIN_DINING },
  { tableNumber: 'T07', name: 'Table 7 (Garden View)', capacity: 4, minPartySize: 2, section: TableSection.MAIN_DINING },
  { tableNumber: 'T08', name: 'Table 8 (Garden View)', capacity: 4, minPartySize: 2, section: TableSection.MAIN_DINING },
  
  // Larger Parties (Main Dining)
  { tableNumber: 'T09', name: 'Table 9 (Grand Arch)', capacity: 6, minPartySize: 4, section: TableSection.MAIN_DINING },
  { tableNumber: 'T10', name: 'Table 10 (Grand Arch)', capacity: 6, minPartySize: 4, section: TableSection.MAIN_DINING },
  { tableNumber: 'T11', name: 'Table 11 (Long Table)', capacity: 8, minPartySize: 5, section: TableSection.MAIN_DINING },

  // Chef's Counter (High-top interactive experience)
  { tableNumber: 'C01', name: "Chef's Counter Seat 1 & 2", capacity: 2, minPartySize: 1, section: TableSection.CHEFS_COUNTER },
  { tableNumber: 'C02', name: "Chef's Counter Seat 3 & 4", capacity: 2, minPartySize: 1, section: TableSection.CHEFS_COUNTER },
  { tableNumber: 'C03', name: "Chef's Counter Seat 5 & 6", capacity: 2, minPartySize: 1, section: TableSection.CHEFS_COUNTER },

  // Outdoor Terrace
  { tableNumber: 'O01', name: 'Terrace Table 1', capacity: 4, minPartySize: 2, section: TableSection.OUTDOOR_TERRACE },
  { tableNumber: 'O02', name: 'Terrace Table 2', capacity: 4, minPartySize: 2, section: TableSection.OUTDOOR_TERRACE },
  { tableNumber: 'O03', name: 'Terrace Table 3', capacity: 2, minPartySize: 1, section: TableSection.OUTDOOR_TERRACE },

  // Private Dining Room
  { tableNumber: 'P01', name: 'Aurelle Executive Salon', capacity: 12, minPartySize: 6, section: TableSection.PRIVATE_DINING },
];

const KANDY_DEFAULT_TABLES: DefaultTableDefinition[] = [
  { tableNumber: 'K01', name: 'Lakefront Table 1', capacity: 2, minPartySize: 1, section: TableSection.MAIN_DINING },
  { tableNumber: 'K02', name: 'Lakefront Table 2', capacity: 2, minPartySize: 1, section: TableSection.MAIN_DINING },
  { tableNumber: 'K03', name: 'Lakefront Table 3', capacity: 4, minPartySize: 2, section: TableSection.MAIN_DINING },
  { tableNumber: 'K04', name: 'Lakefront Table 4', capacity: 4, minPartySize: 2, section: TableSection.MAIN_DINING },
  { tableNumber: 'K05', name: 'Hillside Table 5', capacity: 6, minPartySize: 4, section: TableSection.MAIN_DINING },
  { tableNumber: 'K06', name: 'Sanctuary Pavilion', capacity: 8, minPartySize: 5, section: TableSection.PRIVATE_DINING },
  { tableNumber: 'KO1', name: 'Veranda Table 1', capacity: 4, minPartySize: 2, section: TableSection.OUTDOOR_TERRACE },
];

/**
 * Ensures a location has default tables seeded in MongoDB
 */
export async function ensureLocationTablesConfigured(locationId: string): Promise<number> {
  const count = await Table.countDocuments({ locationId });
  if (count > 0) return count;

  const defs = locationId === 'loc-kandy-vip' ? KANDY_DEFAULT_TABLES : COLOMBO_DEFAULT_TABLES;

  const tablesToInsert = defs.map((t) => ({
    tableNumber: t.tableNumber,
    name: t.name,
    locationId,
    capacity: t.capacity,
    minPartySize: t.minPartySize,
    section: t.section,
    status: TableStatus.AVAILABLE,
    isActive: true,
  }));

  await Table.insertMany(tablesToInsert, { ordered: false }).catch((err) => {
    logger.warn('[TableService] Table seeding caught duplicate key or existing tables:', err.message);
  });

  return await Table.countDocuments({ locationId });
}

/**
 * Get active tables for a location
 */
export async function getActiveTables(locationId: string): Promise<ITableDocument[]> {
  await ensureLocationTablesConfigured(locationId);
  return await Table.find({ locationId, isActive: true }).sort({ capacity: 1, tableNumber: 1 });
}
