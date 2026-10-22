import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { MenuCategory } from '../models/menuCategory.model';
import { MenuItem } from '../models/menuItem.model';
import { PublicationStatus } from '../types/menu';
import { logger } from '../utils/logger';

const SEED_CATEGORIES = [
  {
    name: 'Sri Lankan',
    slug: 'sri-lankan',
    description: 'Island culinary heritage featuring indigenous spices, claypot slow-cooking, and coastal seafood.',
    displayOrder: 1,
    isVisible: true,
  },
  {
    name: 'Indian',
    slug: 'indian',
    description: 'Centuries-old recipes from the Mughal royal kitchens and traditional tandoor clay ovens.',
    displayOrder: 2,
    isVisible: true,
  },
  {
    name: 'East Asian',
    slug: 'east-asian',
    description: 'Precision Japanese knife work, wok mastery, delicate dim sum, and wood-fired marinades.',
    displayOrder: 3,
    isVisible: true,
  },
  {
    name: 'Plant-led',
    slug: 'plant-led',
    description: 'Botanical gastronomy elevating organic heirloom vegetables, forest herbs, and cold-pressed coconut.',
    displayOrder: 4,
    isVisible: true,
  },
  {
    name: 'Dessert',
    slug: 'dessert',
    description: 'Artisanal sweet finales balancing kithul palm treacle, Ceylon spices, and delicate tropical fruits.',
    displayOrder: 5,
    isVisible: true,
  },
  {
    name: 'Drinks',
    slug: 'drinks',
    description: 'Botanical infusions, artisanal single-estate Ceylon teas, and craft cold brews.',
    displayOrder: 6,
    isVisible: true,
  },
];

const SEED_DISHES = [
  // --- SRI LANKAN ---
  {
    name: 'Ceylon Pepper Beef',
    slug: 'ceylon-pepper-beef',
    categorySlug: 'sri-lankan',
    priceMinor: 685000,
    shortDescription: 'Charred tenderloin with Tellicherry pepper crackling',
    description: 'Charred tenderloin, smoked aubergine, curry leaf jus, Tellicherry pepper crackling and hand-tempered shallots.',
    images: ['https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Prime Beef Tenderloin', 'Tellicherry Black Pepper', 'Smoked Aubergine', 'Curry Leaves', 'Shallots'],
    allergens: [],
    dietaryTags: ['GLUTEN-FREE'],
    spiceLevel: 'Medium spice',
    preparationTimeMinutes: 22,
    isAvailable: true,
    isFeatured: true,
    displayOrder: 1,
  },
  {
    name: 'Jaffna Spiced Lamb Shank',
    slug: 'jaffna-spiced-lamb-shank',
    categorySlug: 'sri-lankan',
    priceMinor: 740000,
    shortDescription: 'Slow-braised with roasted coriander and bone marrow sauce',
    description: 'Slow-braised with roasted coriander, toasted shallots, bone marrow sauce and tempered curry leaves.',
    images: ['https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['New Zealand Lamb Shank', 'Jaffna Roasted Curry Powder', 'Bone Marrow', 'Shallots', 'Coconut Milk'],
    allergens: [],
    dietaryTags: ['GLUTEN-FREE'],
    spiceLevel: 'Medium spice',
    preparationTimeMinutes: 30,
    isAvailable: true,
    isFeatured: true,
    displayOrder: 2,
  },
  {
    name: 'Lagoon Crab Ravioli',
    slug: 'lagoon-crab-ravioli',
    categorySlug: 'sri-lankan',
    priceMinor: 520000,
    shortDescription: 'Hand-folded pasta with Negombo crab meat & shellfish bisque',
    description: 'Hand-folded pasta, Negombo crab meat, shellfish bisque, tempered mustard seed & citrus leaf oil.',
    images: ['https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Negombo Lagoon Crab', 'Semolina Flour', 'Shellfish Bisque', 'Mustard Seeds', 'Kaffir Lime Leaf'],
    allergens: ['Shellfish', 'Wheat', 'Eggs', 'Milk'],
    dietaryTags: [],
    spiceLevel: 'Mild spice',
    preparationTimeMinutes: 18,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 3,
  },
  {
    name: 'Claypot Kingfish Thiyal',
    slug: 'claypot-kingfish-thiyal',
    categorySlug: 'sri-lankan',
    priceMinor: 590000,
    shortDescription: 'Seared coastal kingfish simmered in wood-fired black goraka',
    description: 'Seared coastal kingfish simmered in wood-fired black goraka reduction, green chili oil & toasted coconut.',
    images: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Wild Kingfish Fillet', 'Goraka (Garcinia Cambogia)', 'Green Chili Oil', 'Toasted Coconut', 'Fenugreek'],
    allergens: ['Fish'],
    dietaryTags: ['GLUTEN-FREE', 'DAIRY-FREE'],
    spiceLevel: 'Spicy',
    preparationTimeMinutes: 20,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 4,
  },

  // --- INDIAN ---
  {
    name: 'Tandoori Malabar Prawns',
    slug: 'tandoori-malabar-prawns',
    categorySlug: 'indian',
    priceMinor: 640000,
    shortDescription: 'Clay-oven roasted jumbo prawns with stone-ground mustard',
    description: 'Clay-oven roasted jumbo prawns, Kashmiri chili marinade, stone-ground mustard & fresh mint emulsion.',
    images: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Jumbo Tiger Prawns', 'Kashmiri Chili', 'Hung Curd', 'Mustard Oil', 'Wild Mint'],
    allergens: ['Shellfish', 'Milk', 'Mustard'],
    dietaryTags: ['GLUTEN-FREE'],
    spiceLevel: 'Medium spice',
    preparationTimeMinutes: 16,
    isAvailable: true,
    isFeatured: true,
    displayOrder: 5,
  },
  {
    name: 'Old Delhi Smoked Murgh',
    slug: 'old-delhi-smoked-murgh',
    categorySlug: 'indian',
    priceMinor: 580000,
    shortDescription: 'Clay-oven roasted chicken in slow-reduced heirloom tomato makhani',
    description: 'Clay-oven roasted chicken, slow-reduced heirloom tomato makhani, clarified butter & crushed fenugreek leaves.',
    images: ['https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Organic Chicken Breast', 'San Marzano Tomatoes', 'Artisanal Butter', 'Kasuri Methi', 'Single Cream'],
    allergens: ['Milk'],
    dietaryTags: ['HALAL', 'GLUTEN-FREE'],
    spiceLevel: 'Mild spice',
    preparationTimeMinutes: 18,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 6,
  },
  {
    name: 'Dal Bukhara 24-Hour',
    slug: 'dal-bukhara-24-hour',
    categorySlug: 'indian',
    priceMinor: 360000,
    shortDescription: 'Black urad lentils simmered overnight over slow charcoal embers',
    description: 'Black urad lentils simmered overnight over slow charcoal embers with organic churned butter and ginger.',
    images: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Whole Black Urad', 'Heirloom Tomato Purée', 'White Butter', 'Charcoal Smoke', 'Fresh Ginger'],
    allergens: ['Milk'],
    dietaryTags: ['VEGETARIAN', 'GLUTEN-FREE'],
    spiceLevel: 'Mild spice',
    preparationTimeMinutes: 10,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 7,
  },
  {
    name: 'Amritsari Paneer Tikka',
    slug: 'amritsari-paneer-tikka',
    categorySlug: 'indian',
    priceMinor: 420000,
    shortDescription: 'Artisanal cottage cheese infused with ajwain carom seeds',
    description: 'Artisanal cottage cheese infused with ajwain carom seeds, bell peppers, charred over coals with raw mango chutney.',
    images: ['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Grass-Fed Buffalo Paneer', 'Ajwain Seeds', 'Bell Peppers', 'Mustard Oil', 'Raw Mango'],
    allergens: ['Milk', 'Mustard'],
    dietaryTags: ['VEGETARIAN', 'GLUTEN-FREE'],
    spiceLevel: 'Medium spice',
    preparationTimeMinutes: 15,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 8,
  },
  {
    name: 'Awadhi Dum Lamb Biryani',
    slug: 'awadhi-dum-lamb-biryani',
    categorySlug: 'indian',
    priceMinor: 690000,
    shortDescription: 'Fragrant aged basmati sealed under dough with spiced Australian lamb',
    description: 'Fragrant aged basmati rice sealed under dough with slow-braised spiced Australian lamb, saffron strands and mint.',
    images: ['https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Aged Basmati Rice', 'Australian Lamb', 'Kashmiri Saffron', 'Ghee', 'Rose Water', 'Crispy Onions'],
    allergens: ['Milk'],
    dietaryTags: ['HALAL'],
    spiceLevel: 'Medium spice',
    preparationTimeMinutes: 25,
    isAvailable: true,
    isFeatured: true,
    displayOrder: 9,
  },

  // --- EAST ASIAN ---
  {
    name: 'Miso Glazed Black Cod',
    slug: 'miso-glazed-black-cod',
    categorySlug: 'east-asian',
    priceMinor: 790000,
    shortDescription: 'Sake & white mirin 48-hour cure with sweet miso crust',
    description: 'Sake & white mirin 48-hour cure, caramelized sweet miso crust, charred baby bok choy and pickled ginger stem.',
    images: ['https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Wild Alaskan Black Cod', 'Saikyo Sweet White Miso', 'Junmai Sake', 'Hon Mirin', 'Baby Bok Choy'],
    allergens: ['Fish', 'Soy'],
    dietaryTags: ['DAIRY-FREE'],
    spiceLevel: 'Delicate',
    preparationTimeMinutes: 20,
    isAvailable: true,
    isFeatured: true,
    displayOrder: 10,
  },
  {
    name: 'Charred Wagyu Tataki',
    slug: 'charred-wagyu-tataki',
    categorySlug: 'east-asian',
    priceMinor: 820000,
    shortDescription: 'Flash-seared Japanese A5 strip loin with white truffle ponzu',
    description: 'Flash-seared Japanese A5 strip loin, white truffle ponzu, crispy garlic chips and mountain shiso leaves.',
    images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Miyazaki A5 Wagyu Beef', 'White Truffle Ponzu', 'Crispy Garlic Slivers', 'Red Shiso Leaf'],
    allergens: ['Soy', 'Wheat'],
    dietaryTags: [],
    spiceLevel: 'Mild zest',
    preparationTimeMinutes: 12,
    isAvailable: true,
    isFeatured: true,
    displayOrder: 11,
  },
  {
    name: 'Wild Shiitake Dim Sum',
    slug: 'wild-shiitake-dim-sum',
    categorySlug: 'east-asian',
    priceMinor: 380000,
    shortDescription: 'Hand-pleated forest mushroom dumplings in hot truffle broth',
    description: 'Hand-pleated forest mushroom dumplings, piping hot winter truffle broth, sesame crunch chili oil.',
    images: ['https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Wild Shiitake', 'King Oyster Mushrooms', 'Wheat Wrapper', 'Truffle Broth', 'Toasted Sesame Oil'],
    allergens: ['Wheat', 'Sesame', 'Soy'],
    dietaryTags: ['VEGAN', 'PLANT-LED'],
    spiceLevel: 'Medium spice',
    preparationTimeMinutes: 15,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 12,
  },

  // --- PLANT-LED ---
  {
    name: 'Heirloom Roasted Pumpkin',
    slug: 'heirloom-roasted-pumpkin',
    categorySlug: 'plant-led',
    priceMinor: 390000,
    shortDescription: 'Slow-roasted pumpkin with whipped cashew nut cream',
    description: 'Slow-roasted sweet pumpkin, whipped cashew nut cream, tamarind glaze and toasted pumpkin seeds.',
    images: ['https://images.unsplash.com/photo-1547496502-affa22d38842?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Heirloom Butternut Pumpkin', 'Raw Cashew Cream', 'Tamarind Pulp', 'Pumpkin Seeds'],
    allergens: ['Tree Nuts'],
    dietaryTags: ['VEGAN', 'PLANT-LED'],
    spiceLevel: 'Mild spice',
    preparationTimeMinutes: 16,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 13,
  },
  {
    name: 'Smoked Aubergine & Coconut Labneh',
    slug: 'smoked-aubergine-coconut-labneh',
    categorySlug: 'plant-led',
    priceMinor: 340000,
    shortDescription: 'Wood-fired eggplant purée with cold-pressed coconut labneh',
    description: 'Wood-fired eggplant purée, cold-pressed coconut labneh, ruby pomegranate pearls, toasted pine nuts.',
    images: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Charred Eggplant', 'Cultured Coconut Cream', 'Pomegranate Arils', 'Pine Nuts', 'Extra Virgin Olive Oil'],
    allergens: ['Tree Nuts'],
    dietaryTags: ['VEGAN', 'PLANT-LED', 'GLUTEN-FREE'],
    spiceLevel: 'Mild spice',
    preparationTimeMinutes: 12,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 14,
  },
  {
    name: 'Young Jackfruit Confit (Polos)',
    slug: 'young-jackfruit-confit-polos',
    categorySlug: 'plant-led',
    priceMinor: 370000,
    shortDescription: 'Tender green polos braised in dark roasted spice stock',
    description: 'Tender green polos braised in dark roasted spice stock, toasted coconut sambal and string hopper crisp.',
    images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Tender Green Jackfruit', 'Roasted Sri Lankan Spices', 'Toasted Coconut Flakes', 'Pandan Leaf'],
    allergens: [],
    dietaryTags: ['VEGAN', 'PLANT-LED', 'GLUTEN-FREE'],
    spiceLevel: 'Medium spice',
    preparationTimeMinutes: 20,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 15,
  },
  {
    name: 'Charred Brassicas & Macadamia',
    slug: 'charred-brassicas-macadamia',
    categorySlug: 'plant-led',
    priceMinor: 360000,
    shortDescription: 'Fire-roasted broccolini, macadamia emulsion and lime-leaf crunch',
    description: 'Fire-roasted tenderstem broccolini, silky macadamia nut emulsion, lime-leaf chili crunch and wild sorrel.',
    images: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Tenderstem Broccolini', 'Macadamia Nuts', 'Lime Leaf', 'Wild Sorrel', 'Cold Pressed Rapeseed Oil'],
    allergens: ['Tree Nuts'],
    dietaryTags: ['VEGAN', 'PLANT-LED', 'GLUTEN-FREE'],
    spiceLevel: 'Mild zest',
    preparationTimeMinutes: 14,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 16,
  },

  // --- DESSERTS ---
  {
    name: 'Smoked Coconut Panna Cotta',
    slug: 'smoked-coconut-panna-cotta',
    categorySlug: 'dessert',
    priceMinor: 240000,
    shortDescription: 'Kithul treacle reduction with toasted sesame brittle',
    description: 'Kithul treacle reduction, toasted sesame brittle, passion fruit curd, roasted cinnamon oil.',
    images: ['https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Coconut Milk', 'Agar-Agar', 'Organic Kithul Treacle', 'Sesame Seeds', 'Passion Fruit Curd'],
    allergens: ['Sesame'],
    dietaryTags: ['VEGAN', 'GLUTEN-FREE'],
    spiceLevel: 'None',
    preparationTimeMinutes: 8,
    isAvailable: true,
    isFeatured: true,
    displayOrder: 17,
  },
  {
    name: 'Valrhona Dark Chocolate Ganache',
    slug: 'valrhona-dark-chocolate-ganache',
    categorySlug: 'dessert',
    priceMinor: 280000,
    shortDescription: '70% smoked cocoa tart with Ceylon sea salt and raspberry gel',
    description: '70% single-origin dark chocolate ganache, smoked sea salt flakes, raspberry reduction and cocoa nib tuile.',
    images: ['https://images.unsplash.com/photo-1579954115545-a95591f28bfc?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Valrhona 70% Guanaja Chocolate', 'Ceylon Sea Salt', 'Fresh Raspberries', 'Cocoa Nibs'],
    allergens: ['Milk', 'Soy'],
    dietaryTags: ['VEGETARIAN'],
    spiceLevel: 'None',
    preparationTimeMinutes: 10,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 18,
  },

  // --- DRINKS ---
  {
    name: 'Spiced Ceylon Chai & Cold Brew',
    slug: 'spiced-ceylon-chai-cold-brew',
    categorySlug: 'drinks',
    priceMinor: 180000,
    shortDescription: 'Cardamom pods, single-estate black tea & wild honey',
    description: 'Cardamom pods, single-estate black tea, oat milk, crushed cinnamon bark, wild forest honey.',
    images: ['https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Single-Estate Dimbula Tea', 'Green Cardamom', 'Ceylon Cinnamon', 'Oat Milk', 'Wild Honey'],
    allergens: [],
    dietaryTags: ['VEGAN'],
    spiceLevel: 'None',
    preparationTimeMinutes: 5,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 19,
  },
  {
    name: 'Wild Tamarind & Cardamom Spritz',
    slug: 'wild-tamarind-cardamom-spritz',
    categorySlug: 'drinks',
    priceMinor: 160000,
    shortDescription: 'Clarified tamarind, crushed cardamom, sparkling soda & wild mint',
    description: 'Clarified tamarind cordial, green cardamom infusion, sparkling artisanal soda, crushed ice and garden mint.',
    images: ['https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Wild Tamarind Cordial', 'Green Cardamom', 'Sparkling Mineral Water', 'Fresh Garden Mint'],
    allergens: [],
    dietaryTags: ['VEGAN', 'GLUTEN-FREE'],
    spiceLevel: 'None',
    preparationTimeMinutes: 4,
    isAvailable: true,
    isFeatured: true,
    displayOrder: 20,
  },
  {
    name: 'Single-Estate Nuwara Eliya Golden Tea',
    slug: 'single-estate-nuwara-eliya-golden-tea',
    categorySlug: 'drinks',
    priceMinor: 140000,
    shortDescription: 'High-elevation hand-plucked Orange Pekoe steeped with dried citrus',
    description: 'High-elevation hand-plucked Orange Pekoe, crystal mountain spring water, sun-dried citrus peel.',
    images: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Single-Garden Orange Pekoe Tea', 'Sun-Dried Citrus Peel', 'Natural Cane Sugar'],
    allergens: [],
    dietaryTags: ['VEGAN', 'GLUTEN-FREE'],
    spiceLevel: 'None',
    preparationTimeMinutes: 5,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 21,
  },
  {
    name: 'King Coconut Mint Elixir',
    slug: 'king-coconut-mint-elixir',
    categorySlug: 'drinks',
    priceMinor: 150000,
    shortDescription: 'Fresh Thambili water, kaffir lime zest & bruised spearmint',
    description: 'Freshly tapped King Coconut water, cold-extracted kaffir lime zest, bruised organic spearmint, pink Himalayan salt.',
    images: ['https://images.unsplash.com/photo-1525385133512-2f3bdd039054?q=80&w=1000&auto=format&fit=crop'],
    ingredients: ['Fresh King Coconut Water', 'Kaffir Lime Zest', 'Organic Spearmint', 'Himalayan Pink Salt'],
    allergens: [],
    dietaryTags: ['VEGAN', 'GLUTEN-FREE'],
    spiceLevel: 'None',
    preparationTimeMinutes: 4,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 22,
  },
];

export async function seedMenuData() {
  logger.info('[SeedMenu] Connecting to database...');
  await connectDatabase();

  try {
    // 0. Remove obsolete / test categories and dishes
    const allowedSlugs = SEED_CATEGORIES.map((c) => c.slug);
    const deletedCats = await MenuCategory.deleteMany({ slug: { $nin: allowedSlugs } });
    logger.info(`[SeedMenu] Removed ${deletedCats.deletedCount} obsolete/test categories.`);

    const deletedDishes = await MenuItem.deleteMany({
      $or: [
        { categorySlug: { $nin: allowedSlugs } },
        { name: { $regex: /copy|test|dinein|179245|179255/i } },
        { slug: { $regex: /copy|test|dinein|179245|179255/i } },
      ],
    });
    logger.info(`[SeedMenu] Removed ${deletedDishes.deletedCount} obsolete/test dishes.`);

    // 1. Seed or Upsert Categories
    const categoryMap = new Map<string, mongoose.Types.ObjectId>();

    for (const cat of SEED_CATEGORIES) {
      let existing = await MenuCategory.findOne({ slug: cat.slug });
      if (!existing) {
        existing = await MenuCategory.create({
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          displayOrder: cat.displayOrder,
          isVisible: cat.isVisible,
          isArchived: false,
          locationIds: ['loc-colombo-main'],
        });
        logger.info(`[SeedMenu] Created category: ${cat.name} (${cat.slug})`);
      } else {
        existing.name = cat.name;
        existing.description = cat.description;
        existing.displayOrder = cat.displayOrder;
        existing.isVisible = cat.isVisible;
        existing.isArchived = false;
        await existing.save();
      }
      categoryMap.set(cat.slug, existing._id as mongoose.Types.ObjectId);
    }

    // 2. Seed or Upsert Dishes
    for (const dish of SEED_DISHES) {
      const catId = categoryMap.get(dish.categorySlug);
      if (!catId) {
        logger.warn(`[SeedMenu] Unknown category slug: ${dish.categorySlug}`);
        continue;
      }

      const existingDish = await MenuItem.findOne({ slug: dish.slug });
      if (!existingDish) {
        await MenuItem.create({
          name: dish.name,
          slug: dish.slug,
          categoryId: catId,
          categorySlug: dish.categorySlug,
          categoryName: SEED_CATEGORIES.find((c) => c.slug === dish.categorySlug)?.name || 'General',
          priceMinor: dish.priceMinor,
          currency: 'LKR',
          shortDescription: dish.shortDescription,
          description: dish.description,
          images: dish.images,
          ingredients: dish.ingredients,
          allergens: dish.allergens,
          dietaryTags: dish.dietaryTags,
          spiceLevel: dish.spiceLevel,
          preparationTimeMinutes: dish.preparationTimeMinutes,
          isAvailable: dish.isAvailable,
          isFeatured: dish.isFeatured,
          publicationStatus: PublicationStatus.PUBLISHED,
          displayOrder: dish.displayOrder,
          locationIds: ['loc-colombo-main'],
          publishedAt: new Date(),
        });
        logger.info(`[SeedMenu] Created dish: ${dish.name} (LKR ${(dish.priceMinor / 100).toLocaleString()})`);
      } else {
        // Ensure published and current
        existingDish.categoryId = catId;
        existingDish.categorySlug = dish.categorySlug;
        existingDish.categoryName = SEED_CATEGORIES.find((c) => c.slug === dish.categorySlug)?.name || 'General';
        existingDish.priceMinor = dish.priceMinor;
        existingDish.shortDescription = dish.shortDescription;
        existingDish.description = dish.description;
        existingDish.images = dish.images;
        existingDish.ingredients = dish.ingredients;
        existingDish.allergens = dish.allergens;
        existingDish.dietaryTags = dish.dietaryTags;
        existingDish.spiceLevel = dish.spiceLevel;
        existingDish.isAvailable = dish.isAvailable;
        existingDish.isFeatured = dish.isFeatured;
        existingDish.publicationStatus = PublicationStatus.PUBLISHED;
        await existingDish.save();
      }
    }

    const totalCats = await MenuCategory.countDocuments();
    const totalDishes = await MenuItem.countDocuments();
    logger.info(`[SeedMenu] Database menu verified: ${totalCats} categories, ${totalDishes} dishes in MongoDB.`);
  } catch (err) {
    logger.error('[SeedMenu] Error during menu seed:', err);
    throw err;
  }
}

// Execute directly if run as a CLI script
if (require.main === module) {
  seedMenuData()
    .then(async () => {
      logger.info('[SeedMenu] Menu seeding completed successfully.');
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('[SeedMenu] Fatal error during seed:', err);
      await disconnectDatabase();
      process.exit(1);
    });
}
