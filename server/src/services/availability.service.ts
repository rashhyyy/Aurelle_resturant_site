import { Reservation } from '../models/reservation.model';
import { Table } from '../models/table.model';
import { TableSlotAllocation } from '../models/tableSlotAllocation.model';
import { getActiveTables } from './table.service';
import {
  RESERVATION_CONFIG,
  ReservationStatus,
  AvailableTimeSlot,
  AvailabilityResult,
  SeatingPreference,
} from '../types/reservation';
import { getLocationName, VALID_LOCATION_IDS } from '../config/locations';
import { TableSection } from '../types/table';

export interface CheckAvailabilityParams {
  locationId?: string;
  date: string; // YYYY-MM-DD
  guestCount: number;
  seatingPreference?: string;
}

/**
 * Maps frontend seating preference to TableSection enum
 */
export function mapPreferenceToSection(pref?: string): TableSection | null {
  if (!pref || pref === SeatingPreference.NO_PREFERENCE) return null;
  switch (pref) {
    case SeatingPreference.MAIN_DINING:
      return TableSection.MAIN_DINING;
    case SeatingPreference.CHEFS_COUNTER:
      return TableSection.CHEFS_COUNTER;
    case SeatingPreference.OUTDOOR_TERRACE:
      return TableSection.OUTDOOR_TERRACE;
    case SeatingPreference.PRIVATE_DINING:
      return TableSection.PRIVATE_DINING;
    default:
      return null;
  }
}

/**
 * Parses time string like "7:30 PM" or "19:30" into 24h format "19:30"
 */
export function normalizeTime24(timeStr: string): string {
  const trimmed = timeStr.trim().toUpperCase();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return '19:30';

  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const ampm = match[3];

  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;

  return `${hour.toString().padStart(2, '0')}:${minute}`;
}

/**
 * Converts 24h time string ("19:30") to 12h display string ("7:30 PM")
 */
export function formatTime12(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  let hour = parseInt(hStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${mStr} ${ampm}`;
}

/**
 * Creates exact UTC Date from YYYY-MM-DD and HH:mm in Colombo (+05:30) timezone
 */
export function createUtcDateTime(dateStr: string, time24: string): Date {
  const [year, month, day] = dateStr.split('-').map((v) => parseInt(v, 10));
  const [hour, minute] = time24.split(':').map((v) => parseInt(v, 10));

  // ISO string with Sri Lanka offset: YYYY-MM-DDTHH:mm:00+05:30
  const pad = (n: number) => n.toString().padStart(2, '0');
  const isoStr = `${pad(year)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+05:30`;
  return new Date(isoStr);
}

/**
 * Core availability engine calculating slot-by-slot live table capacity
 */
export async function getLiveAvailability(
  params: CheckAvailabilityParams
): Promise<AvailabilityResult> {
  const locationId = params.locationId || RESERVATION_CONFIG.defaultLocationId;
  if (!VALID_LOCATION_IDS.includes(locationId)) {
    throw new Error(`Invalid restaurant location ID: "${locationId}".`);
  }

  const dateStr = params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Invalid reservation date format. Expected YYYY-MM-DD.');
  }

  const guestCount = Number(params.guestCount);
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > RESERVATION_CONFIG.maxPartySize) {
    throw new Error(
      `Guest count must be between 1 and ${RESERVATION_CONFIG.maxPartySize} guests.`
    );
  }

  const now = new Date();

  // Validate date range in local Colombo context
  const startOfRequestedDate = createUtcDateTime(dateStr, '00:00');
  const endOfRequestedDate = createUtcDateTime(dateStr, '23:59');

  const todayStart = new Date(now.getTime() - (now.getTimezoneOffset() + 330) * 60000);
  todayStart.setUTCHours(0, 0, 0, 0);

  if (endOfRequestedDate < now) {
    throw new Error('Reservations cannot be booked for past dates.');
  }

  const maxAdvanceMs = RESERVATION_CONFIG.maxAdvanceDays * 24 * 60 * 60 * 1000;
  if (startOfRequestedDate.getTime() - now.getTime() > maxAdvanceMs) {
    throw new Error(
      `Reservations can only be made up to ${RESERVATION_CONFIG.maxAdvanceDays} days in advance.`
    );
  }

  // 1. Fetch real active tables for this location
  const allTables = await getActiveTables(locationId);
  if (allTables.length === 0) {
    throw new Error(
      `Restaurant tables have not been configured for location: "${locationId}". Setup is required.`
    );
  }

  // Filter compatible tables for party size
  const targetSection = mapPreferenceToSection(params.seatingPreference);
  const compatibleTables = allTables.filter((t) => {
    const sizeOk = t.capacity >= guestCount && t.minPartySize <= guestCount;
    if (!sizeOk) return false;
    if (targetSection && t.section !== targetSection) return false;
    return true;
  });

  // If no tables match specific section preference, fallback to all size-compatible tables
  const effectiveTables =
    compatibleTables.length > 0
      ? compatibleTables
      : allTables.filter((t) => t.capacity >= guestCount && t.minPartySize <= guestCount);

  // If even with fallback no table can seat this party size
  if (effectiveTables.length === 0) {
    throw new Error(
      `No dining tables configured at this venue can seat a party of ${guestCount}. Please contact the restaurant for private dining.`
    );
  }

  // 2. Fetch all active overlapping reservations for the requested day
  // Include safety buffer on both ends of the full day
  const dayWindowStart = new Date(startOfRequestedDate.getTime() - 4 * 60 * 60 * 1000);
  const dayWindowEnd = new Date(endOfRequestedDate.getTime() + 4 * 60 * 60 * 1000);

  const activeReservations = await Reservation.find({
    locationId,
    status: {
      $in: [
        ReservationStatus.PENDING,
        ReservationStatus.CONFIRMED,
        ReservationStatus.CHECKED_IN,
        ReservationStatus.SEATED,
      ],
    },
    startAt: { $lt: dayWindowEnd },
    endAt: { $gt: dayWindowStart },
  }).lean();

  const activeAllocations = await TableSlotAllocation.find({
    locationId,
    slotTime: { $gte: dayWindowStart, $lte: dayWindowEnd },
  }).lean();

  const durationMinutes =
    guestCount >= RESERVATION_CONFIG.largePartyThreshold
      ? RESERVATION_CONFIG.largePartyDurationMinutes
      : RESERVATION_CONFIG.defaultDurationMinutes;

  const turnoverBufferMs = RESERVATION_CONFIG.turnoverBufferMinutes * 60 * 1000;
  const minLeadMs = RESERVATION_CONFIG.minLeadHours * 60 * 60 * 1000;

  // 3. Evaluate each standard time slot
  const slots: AvailableTimeSlot[] = [];

  for (const timeStr of RESERVATION_CONFIG.standardTimeSlots) {
    const time24 = normalizeTime24(timeStr);
    const slotStart = createUtcDateTime(dateStr, time24);
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

    // Check if slot is in the past or within minimum lead time
    if (slotStart.getTime() <= now.getTime() + minLeadMs) {
      slots.push({
        time: timeStr,
        time24,
        available: false,
        remainingTables: 0,
        reason: 'Past Booking Window',
      });
      continue;
    }

    // Overlapping window for this specific slot with turnover buffer
    const slotBufferStart = new Date(slotStart.getTime() - turnoverBufferMs);
    const slotBufferEnd = new Date(slotEnd.getTime() + turnoverBufferMs);

    // Find table IDs already occupied by overlapping bookings
    const bookedTableIdSet = new Set<string>();

    for (const alloc of activeAllocations) {
      const allocTime = new Date(alloc.slotTime).getTime();
      if (allocTime >= slotBufferStart.getTime() && allocTime <= slotBufferEnd.getTime()) {
        bookedTableIdSet.add(alloc.tableId.toString());
      }
    }

    for (const res of activeReservations) {
      const resStart = new Date(res.startAt);
      const resEnd = new Date(res.endAt);

      // Overlap condition
      if (resStart < slotBufferEnd && resEnd > slotBufferStart) {
        if (Array.isArray(res.tableIds)) {
          for (const tid of res.tableIds) {
            bookedTableIdSet.add(tid.toString());
          }
        }
      }
    }

    // Count compatible tables free during this slot
    const availableTables = effectiveTables.filter(
      (tbl) => !bookedTableIdSet.has(tbl._id.toString())
    );

    if (availableTables.length > 0) {
      slots.push({
        time: timeStr,
        time24,
        available: true,
        remainingTables: availableTables.length,
      });
    } else {
      slots.push({
        time: timeStr,
        time24,
        available: false,
        remainingTables: 0,
        reason: 'Fully Booked',
      });
    }
  }

  const isFullyBooked = slots.every((s) => !s.available);

  return {
    locationId,
    locationName: getLocationName(locationId),
    date: dateStr,
    guestCount,
    timezone: RESERVATION_CONFIG.timezone,
    slots,
    operatingHours: RESERVATION_CONFIG.operatingHours,
    isFullyBooked,
  };
}
