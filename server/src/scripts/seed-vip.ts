import dns from 'dns';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { VIPRoom } from '../models/vipRoom.model';
import { PrivateDiningPackage } from '../models/privateDiningPackage.model';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const DEFAULT_VIP_ROOMS = [
  {
    locationId: 'loc-colombo-main',
    name: 'The Ivory Room',
    slug: 'the-ivory-room',
    tag: 'BY REQUEST · EXCLUSIVE',
    subtitle: 'Intimate Elegance & Bespoke Service',
    description:
      'A discreet enclave designed for executive dinners, intimate celebrations, and milestone family gatherings. Anchored by a monolithic hand-finished granite dining table, natural raw linen accents, and warm ambient backlighting.',
    shortDescription: 'Up to 12 guests · private service',
    capacityMin: 6,
    capacityMax: 12,
    squareMeters: '45 m² (485 sq ft)',
    images: [
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=90&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=90&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544025162-d76694265947?q=90&w=1200&auto=format&fit=crop',
    ],
    categories: ['All spaces', 'Intimate', 'Business'],
    features: [
      'Dedicated Private Dining Captain & Sommelier',
      'Separate VIP entrance and private guest cloakroom',
      'Direct discrete kitchen service access corridor',
      'Custom 6-course or 8-course degustation menu curation',
      'High-speed private Wi-Fi and presentation capability',
    ],
    amenities: [
      { label: 'Guest Capacity', detail: '6 to 12 guests comfortably seated' },
      { label: 'Room Size', detail: '45 square meters / 485 square feet' },
      { label: 'Audio & Tech', detail: 'Discreet Bose ceiling audio & 4K display' },
      { label: 'Dedicated Staff', detail: '1 Dedicated Chef, 1 Butler, 1 Sommelier' },
      { label: 'Privacy Level', detail: 'Completely enclosed with solid soundproof walls' },
    ],
    basePriceMinor: 2850000, // LKR 28,500.00
    currency: 'LKR',
    minimumSpendMinor: 15000000, // LKR 150,000.00
    bookingDurationMinutes: 180,
    bufferMinutes: 60,
    isActive: true,
    isPublished: true,
    displayOrder: 1,
  },
  {
    locationId: 'loc-colombo-main',
    name: 'The Garden Salon',
    slug: 'the-garden-salon',
    tag: 'BY REQUEST · CELEBRATIONS',
    subtitle: 'Lush Flora & Flowing Terrace Ambience',
    description:
      'Bathed in warm amber illumination with floor-to-ceiling glass gazing onto illuminated tropical gardens, The Garden Salon is the premier venue for larger celebrations, corporate retreats, and cocktail banquets.',
    shortDescription: 'Up to 24 guests · flexible setting',
    capacityMin: 12,
    capacityMax: 24,
    squareMeters: '85 m² (915 sq ft) + Private Veranda',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=90&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?q=90&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=90&w=1200&auto=format&fit=crop',
    ],
    categories: ['All spaces', 'Celebrations', 'Business'],
    features: [
      'Private garden veranda for pre-dinner Champagne reception',
      'Concealed 85-inch 4K conference & presentation screen',
      'Flexible table layouts: Banquet, Boardroom, or Cocktail',
      'Independent craft cocktail bar station with dedicated mixologist',
      'Surround-sound acoustic tuning with personalized playlist control',
    ],
    amenities: [
      { label: 'Guest Capacity', detail: 'Up to 24 seated / 35 standing reception' },
      { label: 'Room Size', detail: '85 square meters + 40 m² private veranda' },
      { label: 'Audio & Tech', detail: 'Wireless microphones, Bose sound & 85" display' },
      { label: 'Dedicated Staff', detail: 'Full dedicated service brigade & mixologist' },
      { label: 'Outdoor Access', detail: 'Private terrace overlooking tropical garden' },
    ],
    basePriceMinor: 1850000, // LKR 18,500.00
    currency: 'LKR',
    minimumSpendMinor: 25000000, // LKR 250,000.00
    bookingDurationMinutes: 240,
    bufferMinutes: 60,
    isActive: true,
    isPublished: true,
    displayOrder: 2,
  },
  {
    locationId: 'loc-colombo-main',
    name: "Chef's Table",
    slug: 'chefs-table',
    tag: 'BY REQUEST · IMMERSIVE',
    subtitle: 'Front Row to Culinary Choreography',
    description:
      "A dramatic culinary front-row experience situated immediately adjacent to Aurelle's gleaming pass. Guests witness the exact choreography of our master chefs as each creation is torched, plated, and introduced tableside.",
    shortDescription: 'Up to 8 guests · open-kitchen view',
    capacityMin: 4,
    capacityMax: 8,
    squareMeters: '34 m² (365 sq ft)',
    images: [
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=90&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=90&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?q=90&w=1200&auto=format&fit=crop',
    ],
    categories: ['All spaces', 'Intimate', 'Celebrations'],
    features: [
      'Direct personal storytelling and course introductions by Executive Chef',
      'Live table-side smoking, finishing and sauce infusions',
      'Commemorative menus hand-signed by the culinary brigade',
      'Off-menu test kitchen experiments previewed exclusively for the table',
      'Interactive blind wine tasting challenge with our head sommelier',
    ],
    amenities: [
      { label: 'Guest Capacity', detail: '4 to 8 guests maximum (strictly seated)' },
      { label: 'Kitchen Access', detail: 'Unrestricted sightlines into live executive kitchen' },
      { label: 'Chef Interaction', detail: 'Each dish presented personally by the culinary team' },
      { label: 'Exclusive Service', detail: 'Dedicated kitchen captain and beverage director' },
      { label: 'Experience Length', detail: 'Approximately 3 to 3.5 hours' },
    ],
    basePriceMinor: 3400000, // LKR 34,000.00
    currency: 'LKR',
    minimumSpendMinor: 18000000,
    bookingDurationMinutes: 210,
    bufferMinutes: 60,
    isActive: true,
    isPublished: true,
    displayOrder: 3,
  },
  {
    locationId: 'loc-colombo-main',
    name: 'The Cellar Vault',
    slug: 'the-cellar-vault',
    tag: 'BY REQUEST · HERITAGE',
    subtitle: 'Surrounded by Over 1,200 Rare Bottles',
    description:
      "Encased in centuries-old reclaimed brick and temperature-controlled glass vaults holding our most prized vintages, The Cellar Vault offers Aurelle's most moody, dramatic private dining experience.",
    shortDescription: 'Up to 10 guests · temperature-controlled',
    capacityMin: 4,
    capacityMax: 10,
    squareMeters: '38 m² (410 sq ft)',
    images: [
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=90&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=90&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544025162-d76694265947?q=90&w=1200&auto=format&fit=crop',
    ],
    categories: ['All spaces', 'Intimate', 'Celebrations'],
    features: [
      'Private sommelier-led vertical tastings of iconic estates',
      'Coravin rare bottle access without uncorking the entire bottle',
      'Artisanal farmstead cheese & single-origin chocolate pairings',
      'Direct adjoining access to our private digestif and cigar terrace',
    ],
    amenities: [
      { label: 'Guest Capacity', detail: 'Up to 10 guests seated' },
      { label: 'Cellar Atmosphere', detail: 'Enclosed with 1,200+ climate-controlled wine bottles' },
      { label: 'Sommelier Service', detail: 'Personal Head Sommelier assigned for the entire evening' },
      { label: 'Audio & Lighting', detail: 'Custom acoustic tuning and low candlelight setting' },
    ],
    basePriceMinor: 3200000, // LKR 32,000.00
    currency: 'LKR',
    minimumSpendMinor: 16000000,
    bookingDurationMinutes: 180,
    bufferMinutes: 60,
    isActive: true,
    isPublished: true,
    displayOrder: 4,
  },
];

const PACKAGES = [
  {
    locationId: 'loc-colombo-main',
    name: 'The Sovereign Degustation',
    description:
      'Eight courses highlighting rare island harvests, paired with premier cru vintages chosen by our head sommelier.',
    includedServices: ['Dedicated Sommelier', 'Course-by-Course Wine Pairings', 'Personal Butler Service'],
    includedMenuItems: ['Lagoon Crab Ravioli', 'Ceylon Spiced Black Pork Belly', 'Wagyu A5 Striploin', 'Wild Honey Tart'],
    priceMinor: 2850000,
    currency: 'LKR',
    minimumGuests: 6,
    maximumGuests: 12,
    isPublished: true,
  },
  {
    locationId: 'loc-colombo-main',
    name: 'The Terroir Dinner',
    description:
      'Six courses celebrating Sri Lankan coastal produce, charcoal-roasted meats, and fragrant wild herb broths.',
    includedServices: ['Welcome Champagne Toast', 'Tableside Carving', 'Sommelier Selection'],
    includedMenuItems: ['Negombo Prawn Tartare', 'Charcoal Roasted Lamb Shank', 'Cardamom Pod Infused Sorbet'],
    priceMinor: 2100000,
    currency: 'LKR',
    minimumGuests: 6,
    maximumGuests: 12,
    isPublished: true,
  },
  {
    locationId: 'loc-colombo-main',
    name: 'Grand Celebration Feast',
    description:
      'Family-style banquet featuring slow-cooked lamb shanks, lagoon crab ravioli, and claypot seafood selections.',
    includedServices: ['Floral Table Accents', 'Welcome Cocktail Bar', 'Commemorative Menus'],
    includedMenuItems: ['Lagoon Crab Salad', 'Slow-cooked Lamb Shanks', 'Claypot Seafood Biryani'],
    priceMinor: 1850000,
    currency: 'LKR',
    minimumGuests: 12,
    maximumGuests: 24,
    isPublished: true,
  },
  {
    locationId: 'loc-colombo-main',
    name: 'The Atelier Degustation',
    description:
      'Ten-course masterclass exploration including unpublished experimental dishes, paired with reserve cellar pours.',
    includedServices: ['Executive Chef Storytelling', 'Live Table Finishing', 'Signed Menus'],
    includedMenuItems: ['Torched Scallop & Coconut', 'Smoked Duck Breast in Ceylon Cinnamon', 'Estate Gold Tea Panna Cotta'],
    priceMinor: 3400000,
    currency: 'LKR',
    minimumGuests: 4,
    maximumGuests: 8,
    isPublished: true,
  },
];

export async function seedVIPData() {
  console.log('[Seed VIP] Connecting to database...');
  await mongoose.connect(env.MONGODB_URI);

  // Seed rooms
  for (const r of DEFAULT_VIP_ROOMS) {
    const existing = await VIPRoom.findOne({ locationId: r.locationId, slug: r.slug });
    if (existing) {
      Object.assign(existing, r);
      await existing.save();
      console.log(`[Seed VIP] Updated room: ${r.name} (${r.slug})`);
    } else {
      await VIPRoom.create(r);
      console.log(`[Seed VIP] Created room: ${r.name} (${r.slug})`);
    }
  }

  // Seed packages
  for (const p of PACKAGES) {
    const existing = await PrivateDiningPackage.findOne({ locationId: p.locationId, name: p.name });
    if (existing) {
      Object.assign(existing, p);
      await existing.save();
      console.log(`[Seed VIP] Updated package: ${p.name}`);
    } else {
      await PrivateDiningPackage.create(p);
      console.log(`[Seed VIP] Created package: ${p.name}`);
    }
  }

  console.log('\n✅ [Seed VIP] VIP rooms & dining packages seeded successfully!');
  await mongoose.disconnect();
}

if (require.main === module) {
  seedVIPData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed VIP] Fatal error:', err);
      process.exit(1);
    });
}
