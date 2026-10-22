export interface StoryArticle {
  id: string;
  numericId: number;
  title: string;
  subtitle: string;
  tag: string;
  category: "Ingredients" | "Techniques" | "Recipes" | "Traditions";
  readTime: string;
  image: string;
  meta: string;
  excerpt: string;
  chefQuote?: string;
  paragraphs: string[];
  keyNotes: string[];
  pairingDish?: string;
}

export const STORIES: StoryArticle[] = [
  {
    id: "ceylon-cinnamon",
    numericId: 1,
    title: "The Quiet Complexity of Ceylon Cinnamon",
    subtitle: "The Quiet Complexity",
    tag: "INGREDIENTS · 6 MIN",
    category: "Ingredients",
    readTime: "6 min read",
    image:
      "https://images.unsplash.com/photo-1509358271058-acd22cc93898?q=80&w=1600&auto=format&fit=crop",
    meta: "Ingredients spotlight · 6 min",
    excerpt:
      "Harvested from southern coastal groves, true Ceylon cinnamon yields delicate floral sweetness, layered citrus notes, and centuries of artisan craft.",
    chefQuote:
      "Unlike ordinary cassia, true Ceylon cinnamon whispers rather than shouts. It weaves seamlessly into rich broths, citrus cures, and delicate panna cottas.",
    paragraphs: [
      "Known botanically as Cinnamomum verum—meaning 'true cinnamon'—Ceylon cinnamon was born in the mineral-rich soils along the southwestern coast of Sri Lanka. For centuries, ocean winds and tropical rains have endowed these bark quills with an ethereal lightness unmatched anywhere else in the culinary world.",
      "In our kitchen, the journey begins at dawn when local peelers harvest the slender shoots. Using ancient brass knives handed down across generations, they shave away the coarse outer husk to reveal an inner bark no thicker than parchment. Layered delicately by hand into quills, it dries beneath the island sun, curing to a fragrant golden amber.",
      "Where commercial cassia delivers pungent, abrasive cinnamaldehyde that overpowers the palate, Ceylon cinnamon offers delicate floral eugenol, sweet wood, citrus undertones, and a faint lingering note of clove. We use it not only in sweet confections but as a foundational pillar in savory reductions, gentle duck braises, and tempered island curries.",
    ],
    keyNotes: [
      "Origin: Southern Coastal Belt, Mirissa & Galle, Sri Lanka",
      "Flavor Profile: Floral warmth, soft citrus zest, delicate sweet bark",
      "Kitchen Application: Hand-crushed into broths, infused into creams, toasted in whole curries",
    ],
    pairingDish: "Smoked Coconut Panna Cotta & Ceylon Pepper Beef Jus",
  },
  {
    id: "balancing-heat",
    numericId: 2,
    title: "A Chef's Guide to Balancing Heat",
    subtitle: "A Chef's Guide",
    tag: "TECHNIQUE · 8 MIN",
    category: "Techniques",
    readTime: "8 min read",
    image:
      "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?q=80&w=1600&auto=format&fit=crop",
    meta: "Masterclass · 8 min",
    excerpt:
      "Navigating the fierce vibrancy of island chilis and crushed black pepper through gentle coconut milk, slow reduction, and balanced acidity.",
    chefQuote:
      "Spiciness is not an endurance test—it is an aromatic architecture. When heat is balanced with coconut fat and citrus acidity, it opens every taste receptor on the tongue.",
    paragraphs: [
      "In traditional Sri Lankan cuisine, heat is rarely singular. It is constructed in layers. Fresh green bird's eye chilis (kochchi) provide sharp, immediate top notes that awaken the senses, while sun-dried red chilis offer slow, rounded mid-palate warmth. Anchoring it all is Ceylon black pepper, which carries a woody, earthy crescendo in the finish.",
      "The secret to modern fine dining execution lies in the equilibrium of fat and acid. Unrefined first-press coconut milk contains natural medium-chain fats that coat the tongue, softening the sharp edges of capsaicin without dulling its vibrant floral essence.",
      "By finishing our spiced reductions with a flash of kaffir lime juice, sour tamarind water, or wood-smoked goraka (garcinia cambogia), we create tension on the plate: a thrilling oscillation between heat, richness, and refreshing brightness that keeps guests eager for the next bite.",
    ],
    keyNotes: [
      "Core Ingredients: Kochchi (bird's eye), dried Kashmiri chili, Tellicherry black peppercorns",
      "Balance Technique: First-press thick coconut milk fat paired with cold tamarind extraction",
      "The Golden Rule: Season with heat early for depth; garnish with fresh chili oils for vibrancy",
    ],
    pairingDish: "Jaffna Spiced Lamb Shank & Crab Ravioli Shellfish Bisque",
  },
  {
    id: "king-coconut",
    numericId: 3,
    title: "King Coconut, Three Ways",
    subtitle: "Three Ways",
    tag: "RECIPE · 12 MIN",
    category: "Recipes",
    readTime: "12 min read",
    image:
      "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?q=80&w=1600&auto=format&fit=crop",
    meta: "Recipe & Origin · 12 min",
    excerpt:
      "Celebrating Sri Lanka's endemic golden treasure across light granitas, aromatic herbal broths, and chilled coconut water reductions.",
    chefQuote:
      "The bright orange Thambili is the soul of our island. It possesses a subtle salinity and natural sucrose balance that synthetic mixers can never imitate.",
    paragraphs: [
      "Endemic exclusively to the tropical soils of Sri Lanka, the vibrant orange King Coconut (Thambili) is far more than roadside refreshment. To the culinary team at Aurelle, it represents an exquisite raw material whose gentle sweetness and natural mineral salinity offer unparalleled pairing possibilities.",
      "In our six-course degustation, we present King Coconut through three distinct culinary transformations: first, as a flash-frozen granita dressed with lime leaf oil that serves as an invigorating palate cleanser between seafood courses.",
      "Second, the raw water is gently reduced over embers with toasted lemongrass and coriander root to form a crystal-clear poaching broth for delicate lagoon prawns. Finally, the tender coconut flesh (lunu dehi) is blended with kithul palm treacle into a silken sorbet that closes the evening on an unforgettably pure note.",
    ],
    keyNotes: [
      "Harvest: Cut fresh from golden crowns along the central wet zone",
      "Nutrient Profile: Rich in natural potassium, delicate floral electrolytes",
      "Modern Applications: Crystal poaching broths, nitrogen granitas, wild yeast fermented sodas",
    ],
    pairingDish: "Charred Lagoon Prawns with Tamarind & King Coconut Granita",
  },
  {
    id: "ceylon-black-tea",
    numericId: 4,
    title: "Single-Estate Ceylon Black Tea Infusions",
    subtitle: "Single-Estate Infusions",
    tag: "TRADITIONS · 10 MIN",
    category: "Traditions",
    readTime: "10 min read",
    image:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=1600&auto=format&fit=crop",
    meta: "Traditions & Craft · 10 min",
    excerpt:
      "Hand-plucked high-elevation tea leaves steeped with crushed cardamom and wild honey, celebrating generations of island tea craft.",
    chefQuote:
      "Fine tea possesses terroir just like grand cru wine. The morning mist of Nuwara Eliya yields a golden liquor with brisk citrus character and notes of wild eucalyptus.",
    paragraphs: [
      "Perched over 6,000 feet above sea level in the misty highlands of Sri Lanka, single-estate tea gardens produce leaves of astounding clarity. Plucked by hand—strictly two tender leaves and a young bud—each batch carries the signature fingerprint of its mountain microclimate.",
      "At Aurelle, our tea program rivals our wine cellar. Rather than treating tea as an afterthought, we steep single-garden flushes at precisely calibrated temperatures to draw out delicate tannins, notes of dried stone fruit, and fragrant mountain florals.",
      "For our signature evening pour, high-grown Orange Pekoe leaves are cold-steeped for sixteen hours, then elevated with bruised green cardamom, wild bee honey from the dry zone forests, and a delicate splash of oat milk frothed with roasted cinnamon oil.",
    ],
    keyNotes: [
      "Terroir: High-elevation Nuwara Eliya & Dimbula valleys (1,800m+)",
      "Harvest Technique: Hand-plucked two leaves and a bud, orthodox roller rolling",
      "Infusion Pairings: Complements rich braised meats and delicate spiced pastries",
    ],
    pairingDish: "Spiced Ceylon Chai & Cold Brew Tasting Flight",
  },
  {
    id: "tempering-spices",
    numericId: 5,
    title: "The Art of Tempering Whole Spices",
    subtitle: "Tadka & Thumpuwa",
    tag: "TECHNIQUE · 12 MIN",
    category: "Techniques",
    readTime: "12 min read",
    image:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1600&auto=format&fit=crop",
    meta: "Masterclass · 12 min",
    excerpt:
      "Unlocking the aromatic soul of Sri Lankan cuisine through rapid oil blooming, crackling black mustard, and fragrant sprigs of fresh karapincha.",
    chefQuote:
      "The sizzle of black mustard seeds popping in smoking coconut oil is the heartbeat of Sri Lankan cooking. It changes the entire molecular structure of the dish in seconds.",
    paragraphs: [
      "In the culinary lexicon of Sri Lanka, the technique of tempering—locally referred to as 'thumpuwa'—is where raw ingredients transform into poetry. Whole seeds contain essential oils locked deep inside their seed coats; cold grinding releases only a fraction of their depth.",
      "When tossed into searing coconut oil, black mustard seeds crackle and burst, fenugreek loses its harsh bitterness to yield a maple-like fragrance, and sweet shallots caramelize along the edges.",
      "At the very final second before the pan is pulled from the heat, a handful of freshly plucked curry leaves (karapincha) is tossed into the bubbling oil, releasing an intoxicating burst of herbal aroma that crowns our dhal, vegetable curries, and roasted root purées.",
    ],
    keyNotes: [
      "Order of Tempering: Mustard seeds first, followed by cumin, shallots, garlic, and fresh curry leaves last",
      "Temperature Control: High initial heat to pop seeds, immediately dropped to avoid scorching aromatics",
      "Culinary Purpose: Infuses hot oil with volatile aromatic compounds that glaze the entire surface",
    ],
    pairingDish: "Heirloom Pumpkin with Cashew Cream & Tempered Mustard Seeds",
  },
  {
    id: "lagoon-prawns",
    numericId: 6,
    title: "Charred Lagoon Prawns with Tamarind Glaze",
    subtitle: "Coastal Catch",
    tag: "RECIPES · 25 MIN",
    category: "Recipes",
    readTime: "25 min · Serves 2",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1600&auto=format&fit=crop",
    meta: "Chef Recipe · 25 min",
    excerpt:
      "Freshwater jumbo prawns caught at sunrise in Negombo lagoon, charred over coconut charcoal and brushed with tangy tamarind caramel.",
    chefQuote:
      "The smoky char from burning coconut shells against the sweet, plump meat of fresh lagoon prawns is Sri Lankan coastal gastronomy at its most primal and sublime.",
    paragraphs: [
      "Negombo lagoon is renowned for producing some of the sweetest, most succulent freshwater prawns in the Indian Ocean basin. Arriving at our kitchen while the morning mist still hangs over the water, these jumbo prawns require minimal intervention to shine.",
      "We butterfly the shells and sear them over intense coconut charcoal embers. The glowing shells caramelize, perfuming the sweet prawn meat with rich smoky essence.",
      "As the prawns reach tender perfection, they are basted with a reduction of sour village tamarind, palm sugar caramel, crushed green chilies, and cold-pressed sesame oil, served immediately alongside grilled lime halves and warm flatbread.",
    ],
    keyNotes: [
      "Origin: Negombo Lagoon artisanal fishermen, Sri Lanka",
      "Cook Method: Coconut lump charcoal grill at 400°C for fast caramelization",
      "Flavor Harmony: Sweet prawn meat, sour tamarind glaze, smoky charred carapace",
    ],
    pairingDish: "Lagoon Crab Ravioli & Chilled Tamarind Infusion",
  },
];

export function getStoryById(idOrSlug: string): StoryArticle | undefined {
  const normalized = idOrSlug.toLowerCase();
  return STORIES.find(
    (s) =>
      s.id.toLowerCase() === normalized ||
      String(s.numericId) === normalized ||
      s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").includes(normalized),
  );
}
