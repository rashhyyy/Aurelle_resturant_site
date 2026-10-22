export interface SpaceDetail {
  id: string; // slug
  numericId: number;
  name: string;
  tag: string;
  subtitle: string;
  capacity: string;
  guestsCount: string;
  squareMeters: string;
  image: string;
  gallery: string[];
  categories: string[];
  overview: string;
  atmosphere: string;
  features: string[];
  menusAvailable: {
    title: string;
    description: string;
    price: string;
  }[];
  amenities: {
    label: string;
    detail: string;
  }[];
}

export const SPACES: SpaceDetail[] = [
  {
    id: "the-ivory-room",
    numericId: 1,
    name: "The Ivory Room",
    tag: "BY REQUEST · EXCLUSIVE",
    subtitle: "Intimate Elegance & Bespoke Service",
    capacity: "Up to 12 guests · private service",
    guestsCount: "6 – 12 guests seated",
    squareMeters: "45 m² (485 sq ft)",
    image:
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=90&w=1600&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=90&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=90&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=90&w=1200&auto=format&fit=crop",
    ],
    categories: ["All spaces", "Intimate", "Business"],
    overview:
      "A discreet enclave designed for executive dinners, intimate celebrations, and milestone family gatherings. Anchored by a monolithic hand-finished granite dining table, natural raw linen accents, and warm ambient backlighting.",
    atmosphere:
      "Quiet, deeply secluded, and acoustically isolated from the main restaurant. Equipped with dedicated multi-zone climate control and custom Lutron architectural mood lighting.",
    features: [
      "Dedicated Private Dining Captain & Sommelier",
      "Separate VIP entrance and private guest cloakroom",
      "Direct discrete kitchen service access corridor",
      "Custom 6-course or 8-course degustation menu curation",
      "High-speed private Wi-Fi and presentation capability",
    ],
    menusAvailable: [
      {
        title: "The Sovereign Degustation",
        description:
          "Eight courses highlighting rare island harvests, paired with premier cru vintages chosen by our head sommelier.",
        price: "LKR 28,500 per guest",
      },
      {
        title: "The Terroir Dinner",
        description:
          "Six courses celebrating Sri Lankan coastal produce, charcoal-roasted meats, and fragrant wild herb broths.",
        price: "LKR 21,000 per guest",
      },
    ],
    amenities: [
      { label: "Guest Capacity", detail: "6 to 12 guests comfortably seated" },
      { label: "Room Size", detail: "45 square meters / 485 square feet" },
      { label: "Audio & Tech", detail: "Discreet Bose ceiling audio & 4K display" },
      { label: "Dedicated Staff", detail: "1 Dedicated Chef, 1 Butler, 1 Sommelier" },
      { label: "Privacy Level", detail: "Completely enclosed with solid soundproof walls" },
    ],
  },
  {
    id: "the-garden-salon",
    numericId: 2,
    name: "The Garden Salon",
    tag: "BY REQUEST · CELEBRATIONS",
    subtitle: "Lush Flora & Flowing Terrace Ambience",
    capacity: "Up to 24 guests · flexible setting",
    guestsCount: "12 – 24 seated · 35 reception",
    squareMeters: "85 m² (915 sq ft) + Private Veranda",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=90&w=1600&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=90&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?q=90&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=90&w=1200&auto=format&fit=crop",
    ],
    categories: ["All spaces", "Celebrations", "Business"],
    overview:
      "Bathed in warm amber illumination with floor-to-ceiling glass gazing onto illuminated tropical gardens, The Garden Salon is the premier venue for larger celebrations, corporate retreats, and cocktail banquets.",
    atmosphere:
      "Expansive, airy, and lush. Blends tropical courtyard greenery with dark oiled teak, antique brass accents, and seamless double-door access to a private illuminated terrace.",
    features: [
      "Private garden veranda for pre-dinner Champagne reception",
      "Concealed 85-inch 4K conference & presentation screen",
      "Flexible table layouts: Banquet, Boardroom, or Cocktail",
      "Independent craft cocktail bar station with dedicated mixologist",
      "Surround-sound acoustic tuning with personalized playlist control",
    ],
    menusAvailable: [
      {
        title: "Grand Celebration Feast",
        description:
          "Family-style banquet featuring slow-cooked lamb shanks, lagoon crab ravioli, and claypot seafood selections.",
        price: "LKR 18,500 per guest",
      },
      {
        title: "Cocktail & Canapé Soirée",
        description:
          "Ten progressive artisanal canapés accompanied by signature Ceylon botanic cocktails and Champagne.",
        price: "LKR 14,000 per guest",
      },
    ],
    amenities: [
      { label: "Guest Capacity", detail: "Up to 24 seated / 35 standing reception" },
      { label: "Room Size", detail: "85 square meters + 40 m² private veranda" },
      { label: "Audio & Tech", detail: "Wireless microphones, Bose sound & 85\" display" },
      { label: "Dedicated Staff", detail: "Full dedicated service brigade & mixologist" },
      { label: "Outdoor Access", detail: "Private terrace overlooking tropical garden" },
    ],
  },
  {
    id: "chefs-table",
    numericId: 3,
    name: "Chef's Table",
    tag: "BY REQUEST · IMMERSIVE",
    subtitle: "Front Row to Culinary Choreography",
    capacity: "Up to 8 guests · open-kitchen view",
    guestsCount: "4 – 8 guests seated",
    squareMeters: "34 m² (365 sq ft)",
    image:
      "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=90&w=1600&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=90&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=90&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?q=90&w=1200&auto=format&fit=crop",
    ],
    categories: ["All spaces", "Intimate", "Celebrations"],
    overview:
      "A dramatic culinary front-row experience situated immediately adjacent to Aurelle's gleaming pass. Guests witness the exact choreography of our master chefs as each creation is torched, plated, and introduced tableside.",
    atmosphere:
      "Theatrical, vibrant, and deeply engaging. Features custom Italian leather captain chairs, solid dark oak banquettes, and glass partitions offering unobstructed views into the live hearth.",
    features: [
      "Direct personal storytelling and course introductions by Executive Chef",
      "Live table-side smoking, finishing and sauce infusions",
      "Commemorative menus hand-signed by the culinary brigade",
      "Off-menu test kitchen experiments previewed exclusively for the table",
      "Interactive blind wine tasting challenge with our head sommelier",
    ],
    menusAvailable: [
      {
        title: "The Atelier Degustation",
        description:
          "Ten-course masterclass exploration including unpublished experimental dishes, paired with reserve cellar pours.",
        price: "LKR 34,000 per guest",
      },
      {
        title: "The Chef's Journey",
        description:
          "Seven-course signature tasting tracing the culinary origins of Ceylon spices from coastal groves to hill peaks.",
        price: "LKR 26,000 per guest",
      },
    ],
    amenities: [
      { label: "Guest Capacity", detail: "4 to 8 guests maximum (strictly seated)" },
      { label: "Kitchen Access", detail: "Unrestricted sightlines into live executive kitchen" },
      { label: "Chef Interaction", detail: "Each dish presented personally by the culinary team" },
      { label: "Exclusive Service", detail: "Dedicated kitchen captain and beverage director" },
      { label: "Experience Length", detail: "Approximately 3 to 3.5 hours" },
    ],
  },
  {
    id: "the-cellar-vault",
    numericId: 4,
    name: "The Cellar Vault",
    tag: "BY REQUEST · HERITAGE",
    subtitle: "Surrounded by Over 1,200 Rare Bottles",
    capacity: "Up to 10 guests · temperature-controlled",
    guestsCount: "4 – 10 guests seated",
    squareMeters: "38 m² (410 sq ft)",
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=90&w=1600&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=90&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=90&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=90&w=1200&auto=format&fit=crop",
    ],
    categories: ["All spaces", "Intimate", "Celebrations"],
    overview:
      "Encased in centuries-old reclaimed brick and temperature-controlled glass vaults holding our most prized vintages, The Cellar Vault offers Aurelle's most moody, dramatic private dining experience.",
    atmosphere:
      "Subterranean warmth, amber candlelight, soft jazz acoustics, and the deep aroma of seasoned French oak barrels.",
    features: [
      "Private sommelier-led vertical tastings of iconic estates",
      "Coravin rare bottle access without uncorking the entire bottle",
      "Artisanal farmstead cheese & single-origin chocolate pairings",
      "Direct adjoining access to our private digestif and cigar terrace",
    ],
    menusAvailable: [
      {
        title: "The Grand Cru Reserve",
        description:
          "Six-course bespoke dinner tailored around five landmark wine vintages personally selected from the cellar.",
        price: "LKR 32,000 per guest",
      },
    ],
    amenities: [
      { label: "Guest Capacity", detail: "Up to 10 guests seated" },
      { label: "Cellar Atmosphere", detail: "Enclosed with 1,200+ climate-controlled wine bottles" },
      { label: "Sommelier Service", detail: "Personal Head Sommelier assigned for the entire evening" },
      { label: "Audio & Lighting", detail: "Custom acoustic tuning and low candlelight setting" },
    ],
  },
];

export function getSpaceById(idOrSlug: string): SpaceDetail | undefined {
  const normalized = idOrSlug.toLowerCase().trim();
  return (
    SPACES.find((s) => s.id === normalized) ||
    SPACES.find((s) => String(s.numericId) === normalized)
  );
}
