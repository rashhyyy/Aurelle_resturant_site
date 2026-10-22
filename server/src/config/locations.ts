export interface RestaurantLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  active: boolean;
}

export const RESTAURANT_LOCATIONS: RestaurantLocation[] = [
  {
    id: 'loc-colombo-main',
    name: 'Aurelle Colombo (Flagship)',
    city: 'Colombo',
    address: '42 Galle Face Court, Colombo 03',
    active: true,
  },
  {
    id: 'loc-kandy-vip',
    name: 'Aurelle Kandy (Sanctuary)',
    city: 'Kandy',
    address: '18 Victoria Lakefront, Kandy',
    active: true,
  },
];

export const VALID_LOCATION_IDS = RESTAURANT_LOCATIONS.map((l) => l.id);

export function getLocationName(locationId: string): string {
  const loc = RESTAURANT_LOCATIONS.find((l) => l.id === locationId);
  return loc ? loc.name : locationId;
}
