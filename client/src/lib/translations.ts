export type Language = "EN" | "SI" | "TA" | "FR";
export type Currency = "LKR" | "USD" | "EUR" | "GBP";

export interface TranslationDictionary {
  [key: string]: {
    EN: string;
    SI: string;
    TA: string;
    FR: string;
  };
}

export const TRANSLATIONS: TranslationDictionary = {
  // Navigation
  "nav.home": {
    EN: "Home",
    SI: "මුල් පිටුව",
    TA: "முகப்பு",
    FR: "Accueil",
  },
  "nav.menu": {
    EN: "Menu",
    SI: "මෙනුව",
    TA: "உணவுப் பட்டியல்",
    FR: "Menu",
  },
  "nav.reservations": {
    EN: "Reservations",
    SI: "වෙන්කිරීම්",
    TA: "முன்பதிவுகள்",
    FR: "Réservations",
  },
  "nav.vip": {
    EN: "VIP & Events",
    SI: "විශේෂ උත්සව",
    TA: "விஐபி & நிகழ்வுகள்",
    FR: "VIP & Événements",
  },
  "nav.recipes": {
    EN: "Recipes",
    SI: "වට්ටෝරු",
    TA: "சமையල් குறிப்புகள்",
    FR: "Recettes",
  },
  "nav.ourStory": {
    EN: "Our Story",
    SI: "අපේ කතාව",
    TA: "எங்கள் கதை",
    FR: "Notre Histoire",
  },
  "nav.contact": {
    EN: "Contact",
    SI: "සම්බන්ධ වන්න",
    TA: "தொடர்பு கொள்ள",
    FR: "Contact",
  },
  "nav.bookTable": {
    EN: "Book a Table",
    SI: "මේසයක් වෙන්කරන්න",
    TA: "மேஜை முன்பதிவு",
    FR: "Réserver une Table",
  },
  "nav.search": {
    EN: "Search",
    SI: "සොයන්න",
    TA: "தேடுங்கள்",
    FR: "Rechercher",
  },
  "nav.searchPlaceholder": {
    EN: "Search dishes, ingredients, wine...",
    SI: "කෑම වර්ග, අමුද්‍රව්‍ය සොයන්න...",
    TA: "உணவுகள், மூலப்பொருட்களைத் தேடுங்கள்...",
    FR: "Rechercher des plats, ingrédients, vins...",
  },
  "nav.account": {
    EN: "My Account",
    SI: "මගේ ගිණුම",
    TA: "என் கணக்கு",
    FR: "Mon Compte",
  },
  "nav.profile": {
    EN: "My Profile",
    SI: "මගේ පැතිකඩ",
    TA: "என் சுயவிவரம்",
    FR: "Mon Profil",
  },
  "nav.signIn": {
    EN: "Sign In",
    SI: "ඇතුල් වන්න",
    TA: "உள்நுழைக",
    FR: "Se Connecter",
  },
  "nav.preferences": {
    EN: "Preferences",
    SI: "අභිරුචි",
    TA: "விருப்பங்கள்",
    FR: "Préférences",
  },
  "nav.shoppingBag": {
    EN: "Shopping Bag",
    SI: "සාප්පු බෑගය",
    TA: "ஷாப்பிங் பை",
    FR: "Panier",
  },

  // Hero Section
  "hero.badge": {
    EN: "Thoughtfully timed.",
    SI: "නියමිත වේලාවට.",
    TA: "சரியான நேரத்தில்.",
    FR: "Parfaitement orchestrée.",
  },
  "hero.title": {
    EN: "Exceptional dining.",
    SI: "සුවිශේෂී භෝජන අත්දැකීමක්.",
    TA: "நேர்த்தியான உணவு அனுபவம்.",
    FR: "Une gastronomie d'exception.",
  },
  "hero.timed": {
    EN: "Thoughtfully timed.",
    SI: "නියමිත වේලාවට.",
    TA: "சரியான நேரத்தில்.",
    FR: "Parfaitement orchestrée.",
  },
  "hero.subtitle": {
    EN: "A considered journey through Sri Lanka and the world, shaped by the season and served with warm, intuitive hospitality.",
    SI: "ශ්‍රී ලංකාව සහ ලොව පුරා රසයන්ගෙන් හැඩගැසුණු, උණුසුම් ආගන්තුක සත්කාරයෙන් පිරි සුවිශේෂී භෝජන චාරිකාවක්.",
    TA: "இலங்கை மற்றும் உலகளாவிய சுவைகளால் உருவான, அன்பான விருந்தோம்பலுடன் கூடிய தனித்துவமான உணவுப் பயணம்.",
    FR: "Un voyage culinaire pensé à travers le Sri Lanka et le monde, façonné par les saisons et servi avec une hospitalité chaleureuse et intuitive.",
  },
  "hero.reserveBtn": {
    EN: "Reserve a Table",
    SI: "මේසයක් වෙන්කරන්න",
    TA: "மேஜை முன்பதிவு",
    FR: "Réserver une Table",
  },
  "hero.reserveTable": {
    EN: "RESERVE A TABLE",
    SI: "මේසයක් වෙන්කරන්න",
    TA: "மேஜை முன்பதிவு",
    FR: "RÉSERVER UNE TABLE",
  },
  "hero.exploreMenu": {
    EN: "EXPLORE THE MENU",
    SI: "මෙනුව බලන්න",
    TA: "மெனுவை பார்க்க",
    FR: "EXPLORER LE MENU",
  },
  "hero.orderPickup": {
    EN: "Order for Pickup",
    SI: "පිකප් සඳහා ඇණවුම් කරන්න",
    TA: "எடுத்துச்செல்ல ஆர்டர் செய்க",
    FR: "Commander à Emporter",
  },
  "hero.today": {
    EN: "TODAY",
    SI: "අද දින",
    TA: "இன்று",
    FR: "AUJOURD'HUI",
  },
  "hero.dinnerHours": {
    EN: "Dinner 5:30–10:30 PM",
    SI: "රාත්‍රී භෝජන 5:30–10:30 ප.ව.",
    TA: "இரவு உணவு 5:30–10:30 PM",
    FR: "Dîner 17h30–22h30",
  },
  "hero.hoursNotice": {
    EN: "Illustrative hours · confirm before visiting",
    SI: "දර්ශක වේලාවන් · පැමිණීමට පෙර තහවුරු කරන්න",
    TA: "விளக்கக் காட்சி நேரங்கள் · வருவதற்கு முன் உறுதிப்படுத்தவும்",
    FR: "Horaires indicatifs · à confirmer avant votre visite",
  },
  "seasonal.bannerTitle": {
    EN: "SEASONAL MENU",
    SI: "සෘතුමය මෙනුව",
    TA: "பருவகාල மெனு",
    FR: "MENU DE SAISON",
  },
  "seasonal.bannerText": {
    EN: "Island harvest — a six-course exploration of smoke, spice and coastal produce.",
    SI: "දූපත් අස්වැන්න — දුම, කුළුබඩු සහ වෙරළබඩ අස්වැන්න පිළිබඳ හය-පාඨමාලා ගවේෂණයක්.",
    TA: "தீவு அறுவடை — புகை, மசாலா மற்றும் கடற்கரை விளைச்சலின் ஆறு-பாடநெறி ஆய்வு.",
    FR: "Récolte insulaire — une exploration en six temps de fumée, d'épices et de produits côtiers.",
  },
  "seasonal.reserveExp": {
    EN: "Reserve the experience",
    SI: "අත්දැකීම වෙන්කරවා ගන්න",
    TA: "அனுபவத்தை பதிவு செய்யவும்",
    FR: "Réserver l'expérience",
  },

  // Highlights & Categories
  "highlights.curated": {
    EN: "Curated Menus",
    SI: "තෝරාගත් මෙනු",
    TA: "தேர்ந்தெடுக்கப்பட்ட மெனு",
    FR: "Menus Soignés",
  },
  "highlights.curatedDesc": {
    EN: "Artisanal seasonal offerings inspired by global coastal terroirs and heritage spices.",
    SI: "දේශීය සහ ජාත්‍යන්තර වෙරළබඩ රසයන්ගෙන් ආභාෂය ලැබූ සෘතුමය කෑම වර්ග.",
    TA: "பாரம்பரிய நறுமணப் பொருட்களால் ஈர்க்கப்பட்ட நேர்த்தியான பருவகால உணவுகள்.",
    FR: "Offrandes artisanales de saison inspirées des terroirs côtiers du monde.",
  },
  "highlights.privateDining": {
    EN: "Private Dining",
    SI: "පෞද්ගලික භෝජනාගාර",
    TA: "பிரத்தியேக உணவு கூடம்",
    FR: "Salons Privés",
  },
  "highlights.privateDiningDesc": {
    EN: "Intimate dining suites with bespoke culinary degustation and tailored sommelier service.",
    SI: "සුවිශේෂී පුද්ගලික සේවාවක් සමඟින් රසවිඳිය හැකි පෞද්ගලික භෝජනාගාර.",
    TA: "தனிப்பயனாக்கப்பட்ட சமையல் விருந்துகளுக்கான பிரத்தியேக சொகுசு அறைகள்.",
    FR: "Suites privées intimes avec dégustation sur-mesure et service sommelier.",
  },
  "highlights.sensory": {
    EN: "Sensory Moments",
    SI: "සුවිශේෂී මොහොතවල්",
    TA: "உணர்ச்சிமய தருணங்கள்",
    FR: "Instants Sensoriels",
  },
  "highlights.sensoryDesc": {
    EN: "Harmonized acoustic design, curated ambient light, and elevated table craft.",
    SI: "මනා සංගීතය, ආලෝකය සහ පරිසරය මුසු වූ ප්‍රියජනක අත්දැකීමක්.",
    TA: "இன்னிசை, மெல்லிய ஒளி மற்றும் நேர்த்தியான மேஜை அலங்காரங்கள்.",
    FR: "Design acoustique harmonieux, lumière tamisée et art de la table raffiné.",
  },

  // Experience Section - Private Dining & Philosophy
  "experience.privateDiningBadge": {
    EN: "PRIVATE DINING",
    SI: "පෞද්ගලික භෝජනාගාර",
    TA: "பிரத்தியேக உணவு கூடம்",
    FR: "SALONS PRIVÉS",
  },
  "experience.privateDiningTitle": {
    EN: "An occasion, entirely your own",
    SI: "ඔබටම වෙන්වූ සුවිශේෂී අවස්ථාවක්",
    TA: "உங்களுக்கே உரித்தான ஒரு தனித்துவமான தருணம்",
    FR: "Une occasion entièrement vôtre",
  },
  "experience.privateDiningDesc1": {
    EN: "From intimate milestone celebrations to distinguished corporate gatherings, our secluded private dining suites offer an elevated sanctuary tailored entirely to your rhythm.",
    SI: "සංවත්සර සැමරුම්වල සිට ව්‍යාපාරික හමුවන් දක්වා, අපගේ සුවිශේෂී පෞද්ගලික භෝජන මැදිරි ඔබේ කැමැත්ත පරිදි පරිපූර්ණ අත්දැකීමක් ලබා දෙයි.",
    TA: "நெருக்கமான கொண்டாட்டங்கள் முதல் பெருநிறுவன சந்திப்புகள் வரை, எங்கள் பிரத்தியேக அறைகள் உங்கள் விருப்பத்திற்கு ஏற்ற தனித்துவமான சூழலை வழங்குகின்றன.",
    FR: "Des célébrations intimes aux réceptions d'affaires de prestige, nos salons privés offrent un sanctuaire raffiné adapté à votre rythme.",
  },
  "experience.privateDiningDesc2": {
    EN: "Immerse your guests in bespoke multi-course degustation menus crafted in collaboration with our Executive Chef, paired with rare vintage allocations from our sommelier's cellar and accompanied by dedicated, intuitive hospitality.",
    SI: "අපගේ ප්‍රධාන සූපවේදීන් සමඟ එක්ව සකස් කරන ලද විශේෂ බහු-පාඨමාලා මෙනු, දුර්ලභ වයින් වර්ග සහ සුහදශීලී කාර්ය මණ්ඩල සේවය සමඟ අමතක නොවන අත්දැකීමක් විඳගන්න.",
    TA: "எங்கள் தலைமை சமையல் கலைஞருடன் இணைந்து உருவாக்கப்பட்ட சிறப்பு மெனுக்கள், அரிய வகை ஒயின்கள் மற்றும் நேர்த்தியான விருந்தோம்பலுடன் மறக்க முடியாத அனுபவத்தைப் பெறுங்கள்.",
    FR: "Offrez à vos convives des menus dégustation sur mesure créés avec notre chef exécutif, accompagnés de millésimes rares et d'un service discret et attentionné.",
  },
  "experience.explorePrivateDining": {
    EN: "EXPLORE PRIVATE DINING",
    SI: "පෞද්ගලික භෝජනාගාර ගවේෂණය කරන්න",
    TA: "பிரத்தியேக உணவு கூடங்களை அறிய",
    FR: "EXPLORER LES SALONS PRIVÉS",
  },
  "experience.philosophyBadge": {
    EN: "OUR PHILOSOPHY",
    SI: "අපගේ දර්ශනය",
    TA: "எங்கள் தத்துவம்",
    FR: "NOTRE PHILOSOPHIE",
  },
  "experience.philosophyTitle1": {
    EN: "Global in outlook.",
    SI: "ගෝලීය දැක්මක් සහිතයි.",
    TA: "உலகளாவிய பார்வை.",
    FR: "Une vision globale.",
  },
  "experience.philosophyTitle2": {
    EN: "Grounded in place.",
    SI: "ස්වභාවිකත්වයට සමීපයි.",
    TA: "மண்ணோடு இணைந்தது.",
    FR: "Ancrée dans son terroir.",
  },
  "experience.philosophyDesc1": {
    EN: "At AURELLE, fine dining is an ongoing dialogue between heritage and contemporary innovation. Rooted in the fertile soils and vibrant coastal terroirs of Sri Lanka, our kitchen celebrates centuries-old spice craftsmanship, slow-fire hearth cooking, and wild-caught ocean harvests, refined through modern global gastronomy.",
    SI: "AURELLE හි විශිෂ්ට භෝජන සංග්‍රහය යනු පාරම්පරික උරුමය සහ නවීන නවෝත්පාදනය අතර සුසංයෝගයකි. ශ්‍රී ලංකාවේ සාරවත් පස සහ සරුසාර වෙරළබඩ සම්පත් මත පදනම්ව, සියවස් ගණනක් පැරණි කුළුබඩු කලාව සහ ස්වභාවික අස්වැන්න අපගේ මුළුතැන්ගෙයෙහි නවීන තාක්ෂණය සමඟ එක්තැන් වේ.",
    TA: "AURELLE-இல் உணவு என்பது பாரம்பரியத்திற்கும் நவீனத்துவத்திற்கும் இடையிலான ஒரு நேர்த்தியான உரையாடல். இலங்கையின் செழுமையான மண் மற்றும் கடற்கரை வளங்களை அடிப்படையாகக் கொண்டு, பாரம்பரிய நறுமணப் பொருட்கள் நவீன சமையல் கலையுடன் இணைக்கப்படுகின்றன.",
    FR: "Chez AURELLE, la haute gastronomie est un dialogue continu entre héritage et innovation contemporaine. Ancrée dans les terroirs fertiles et maritimes du Sri Lanka, notre cuisine célèbre l'art séculaire des épices, la cuisson au feu de bois et les trésors de l'océan, sublimés par des techniques culinaires d'avant-garde.",
  },
  "experience.philosophyDesc2": {
    EN: "We forge personal partnerships with local organic growers, highland tea estates, and artisanal divers. Every dish is a balanced study in temperature, texture, and aroma—served with thoughtful pacing and the quiet, heartfelt warmth of intuitive island hospitality.",
    SI: "අපි දේශීය කාබනික ගොවීන්, තේ වතු සහ සාම්ප්‍රදායික ධීවර ප්‍රජාවන් සමඟ සෘජුව සම්බන්ධ වී සිටිමු. සෑම ආහාරයක්ම උෂ්ණත්වය, වයනය සහ සුවඳ අතර පරිපූර්ණ සමතුලිතතාවයක් වන අතර, උණුසුම් ආගන්තුක සත්කාරයෙන් යුතුව පිරිනැමේ.",
    TA: "நாங்கள் உள்ளூர் இயற்கை விவசாயிகள், தேயிலைத் தோட்டங்கள் மற்றும் பாரம்பரிய மீனவர்களுடன் நேரடியாக இணைந்து செயல்படுகிறோம். ஒவ்வொரு உணவும் சுவை, மணம் மற்றும் அமைப்பின் சரியான சமநிலையாக அன்பான விருந்தோம்பலுடன் பரிமாறப்படுகிறது.",
    FR: "Nous tissons des liens étroits avec les producteurs biologiques locaux, les plantations de thé des hauts plateaux et les pêcheurs artisanaux. Chaque assiette est une composition équilibrée servie avec une hospitalité insulaire chaleureuse et sincère.",
  },
  "experience.meetChefs": {
    EN: "Meet our chefs",
    SI: "අපගේ සූපවේදීන් හමුවන්න",
    TA: "எங்கள் சமையல் கலைஞர்களை சந்திக்க",
    FR: "Rencontrer nos chefs",
  },

  // Signature Dishes
  "dishes.badge": {
    EN: "SIGNATURE SELECTION",
    SI: "සුවිශේෂී තේරීම්",
    TA: "சிறப்புத் தேர்வுகள்",
    FR: "SÉLECTION SIGNATURE",
  },
  "dishes.title": {
    EN: "Culinary Masterpieces",
    SI: "විශිෂ්ට සූපවේදී නිර්මාණ",
    TA: "சமையல் கலைப் படைப்புகள்",
    FR: "Chefs-d'œuvre Culinaires",
  },
  "dishes.subtitle": {
    EN: "Each creation is an expression of balance, culinary discipline, and uncompromising ingredient sourcing.",
    SI: "සෑම කෑමක්ම සමබරතාවය සහ උසස් තත්වයේ අමුද්‍රව්‍යවල විශිෂ්ට එකතුවකි.",
    TA: "ஒவ்வொரு உணவும் சமநிலை மற்றும் மிகச் சிறந்த மூலப்பொருட்களின் சங்கமமாகும்.",
    FR: "Chaque création est une expression d'équilibre, de discipline et d'ingrédients d'exception.",
  },
  "dishes.addToBag": {
    EN: "ADD TO BAG",
    SI: "බෑගයට එකතු කරන්න",
    TA: "பையில் சேர்க்கவும்",
    FR: "AJOUTER AU PANIER",
  },
  "dishes.added": {
    EN: "ADDED",
    SI: "එකතු කරන ලදී",
    TA: "சேர்க்கப்பட்டது",
    FR: "AJOUTÉ",
  },
  "dishes.viewAll": {
    EN: "VIEW COMPLETE MENU",
    SI: "සම්පූර්ණ මෙනුව බලන්න",
    TA: "முழு மெனுவை பார்க்க",
    FR: "VOIR TOUT LE MENU",
  },

  // Menu Page
  "menu.title": {
    EN: "The Culinary Menu",
    SI: "අපගේ මෙනුව",
    TA: "எங்கள் மெனு",
    FR: "Notre Carte Gastronomique",
  },
  "menu.subtitle": {
    EN: "Explore our thoughtfully curated seasonal tasting and à la carte dishes.",
    SI: "අපගේ සෘතුමය සහ රසවත් කෑම වර්ග ගවේෂණය කරන්න.",
    TA: "எங்களின் சுவையான பருவகால உணவுகளை ஆராயுங்கள்.",
    FR: "Découvrez nos menus dégustation et créations à la carte.",
  },
  "menu.all": {
    EN: "All",
    SI: "සියල්ල",
    TA: "அனைத்தும்",
    FR: "Tous",
  },
  "menu.starters": {
    EN: "Starters",
    SI: "ආරම්භක කෑම",
    TA: "ஆரம்ப உணவுகள்",
    FR: "Entrées",
  },
  "menu.mains": {
    EN: "Mains",
    SI: "ප්‍රධාන කෑම",
    TA: "முதன்மை உணவுகள்",
    FR: "Plats Principaux",
  },
  "menu.desserts": {
    EN: "Desserts",
    SI: "අතුරුපස",
    TA: "இனிப்புகள்",
    FR: "Desserts",
  },
  "menu.beverages": {
    EN: "Beverages",
    SI: "පාන වර්ග",
    TA: "பானங்கள்",
    FR: "Boissons",
  },
  "menu.wine": {
    EN: "Wine & Cellar",
    SI: "වයින්",
    TA: "ஒயின்",
    FR: "Vins & Cave",
  },
  "menu.specials": {
    EN: "Chef's Specials",
    SI: "විශේෂ කෑම",
    TA: "சிறப்பு உணவுகள்",
    FR: "Spécialités du Chef",
  },
  "menu.searchPlaceholder": {
    EN: "Search dishes, ingredients, dietary tags...",
    SI: "කෑම හෝ අමුද්‍රව්‍ය සොයන්න...",
    TA: "உணவுகள், மூலப்பொருட்களைத் தேடுங்கள்...",
    FR: "Rechercher un plat, un ingrédient...",
  },
  "menu.soldOut": {
    EN: "Sold Out",
    SI: "අවසන් වී ඇත",
    TA: "விற்றுத் தீர்ந்தது",
    FR: "Épuisé",
  },
  "menu.freshlyPrepared": {
    EN: "Freshly prepared",
    SI: "නැවුම්ව පිළියෙළ කෙරේ",
    TA: "புதிதாக தயாரிக்கப்பட்டது",
    FR: "Fraîchement préparé",
  },

  // Cart Drawer & Cart Page
  "cart.title": {
    EN: "Your Shopping Bag",
    SI: "ඔබේ සාප්පු බෑගය",
    TA: "உங்கள் ஷாப்பிங் பை",
    FR: "Votre Panier",
  },
  "cart.empty": {
    EN: "Your bag is empty",
    SI: "ඔබේ බෑගය හිස්ය",
    TA: "உங்கள் பை காலியாக உள்ளது",
    FR: "Votre panier est vide",
  },
  "cart.emptyDesc": {
    EN: "Explore our menu and add exquisite dishes to begin your order.",
    SI: "කෑම වර්ග තෝරා ඔබේ ඇණවුම ආරම්භ කරන්න.",
    TA: "சுவையான உணவுகளைச் சேர்த்து உங்கள் ஆர்டரைத் தொடங்குங்கள்.",
    FR: "Explorez notre carte et ajoutez des plats pour commencer votre commande.",
  },
  "cart.subtotal": {
    EN: "Subtotal",
    SI: "උප එකතුව",
    TA: "கூட்டுத்தொகை",
    FR: "Sous-total",
  },
  "cart.taxNote": {
    EN: "Taxes and service charges calculated at checkout.",
    SI: "බදු සහ සේවා ගාස්තු ගෙවීමේදී ගණනය කෙරේ.",
    TA: "வரிகள் மற்றும் சேவைக் கட்டணங்கள் செக் அவுட்டில் கணக்கிடப்படும்.",
    FR: "Taxes et frais de service calculés au paiement.",
  },
  "cart.checkout": {
    EN: "PROCEED TO CHECKOUT",
    SI: "ගෙවීමට යන්න",
    TA: "செக் அவுட் செய்ய",
    FR: "PASSER LA COMMANDE",
  },
  "cart.remove": {
    EN: "Remove",
    SI: "ඉවත් කරන්න",
    TA: "நீக்குக",
    FR: "Supprimer",
  },
  "cart.qty": {
    EN: "Qty",
    SI: "ප්‍රමාණය",
    TA: "அளவு",
    FR: "Qté",
  },

  // Reservations
  "res.badge": {
    EN: "TABLE RESERVATION",
    SI: "මේස වෙන්කිරීම",
    TA: "மேஜை முன்பதிவு",
    FR: "RÉSERVATION DE TABLE",
  },
  "res.title": {
    EN: "Reserve Your Experience",
    SI: "ඔබේ භෝජන අත්දැකීම වෙන්කරගන්න",
    TA: "உங்கள் உணவு அனுபவத்தை முன்பதிவு செய்யுங்கள்",
    FR: "Réservez Votre Expérience",
  },
  "res.subtitle": {
    EN: "Join us for an evening of culinary excellence. We recommend booking in advance.",
    SI: "විශිෂ්ට භෝජන අත්දැකීමක් සඳහා කල්තියා මේසයක් වෙන්කරවා ගන්න.",
    TA: "முன்கூட்டியே மேஜையை முன்பதிவு செய்து எங்களோடு இணையுங்கள்.",
    FR: "Rejoignez-nous pour une soirée d'exception. Réservation à l'avance conseillée.",
  },
  "res.date": {
    EN: "Date",
    SI: "දිනය",
    TA: "தேதி",
    FR: "Date",
  },
  "res.time": {
    EN: "Time",
    SI: "වේලාව",
    TA: "நேரம்",
    FR: "Heure",
  },
  "res.guests": {
    EN: "Guests",
    SI: "අමුත්තන් ගණන",
    TA: "விருந்தினர்கள்",
    FR: "Convives",
  },
  "res.confirm": {
    EN: "Confirm Reservation",
    SI: "වෙන්කිරීම තහවුරු කරන්න",
    TA: "முன்பதிவை உறுதிசெய்",
    FR: "Confirmer la Réservation",
  },

  // Preferences Modal
  "pref.title": {
    EN: "Preferences",
    SI: "අභිරුචි",
    TA: "விருப்பத்தேர்வுகள்",
    FR: "Préférences",
  },
  "pref.langTitle": {
    EN: "Language",
    SI: "භාෂාව",
    TA: "மொழி",
    FR: "Langue",
  },
  "pref.langDesc": {
    EN: "Choose your interface language",
    SI: "ඔබ කැමති භාෂාව තෝරන්න",
    TA: "உங்கள் இடைமுக மொழியைத் தேர்ந்தெடுக்கவும்",
    FR: "Choisissez la langue de l'interface",
  },
  "pref.currTitle": {
    EN: "Display currency",
    SI: "මුදල් ඒකකය",
    TA: "நாணயம்",
    FR: "Devise d'affichage",
  },
  "pref.currDesc": {
    EN: "Convert prices dynamically across the entire website.",
    SI: "වෙබ් අඩවිය පුරා මිල ගණන් ක්ෂණිකව පරිවර්තනය කරන්න.",
    TA: "வலைத்தளம் முழுவதும் விலைகளை மாற்றி அமைக்கவும்.",
    FR: "Convertissez les prix dynamiquement sur tout le site.",
  },
  "pref.themeTitle": {
    EN: "Appearance",
    SI: "පෙනුම",
    TA: "தோற்றம்",
    FR: "Apparence",
  },
  "pref.themeDesc": {
    EN: "Use a theme that feels comfortable.",
    SI: "ඔබට පහසු තේමාව තෝරාගන්න.",
    TA: "உங்களுக்கு விருப்பமான தீமை தேர்ந்தெடுக்கவும்.",
    FR: "Choisissez le thème le plus confortable.",
  },
  "pref.back": {
    EN: "BACK",
    SI: "ආපසු",
    TA: "பின்செல்",
    FR: "RETOUR",
  },
  "pref.save": {
    EN: "Save Preferences",
    SI: "තහවුරු කරන්න",
    TA: "சேமிக்கவும்",
    FR: "Enregistrer",
  },

  // Footer
  "footer.tagline": {
    EN: "Exceptional dining, thoughtfully timed. Modern culinary artistry inspired by oceanic terroirs.",
    SI: "සුවිශේෂී භෝජන අත්දැකීමක්, නියමිත වේලාවට. සාගර ආශ්‍රිත විශිෂ්ට සූපවේදී නිර්මාණ.",
    TA: "நேர்த்தியான உணவு அனுபவம், சரியான நேரத்தில். கடலோர சுவைகளால் ஈர்க்கப்பட்ட நவீன சமையல் கலை.",
    FR: "Une gastronomie d'exception, parfaitement orchestrée. Un art culinaire inspiré des terroirs marins.",
  },
  "footer.navigation": {
    EN: "Navigation",
    SI: "මඟපෙන්වීම",
    TA: "வழிகாட்டல்",
    FR: "Navigation",
  },
  "footer.hours": {
    EN: "Hours & Location",
    SI: "වේලාව සහ ස්ථානය",
    TA: "நேரம் & இருப்பிடம்",
    FR: "Horaires & Adresse",
  },
  "footer.newsletter": {
    EN: "Private Journal",
    SI: "පුවත් සඟරාව",
    TA: "செய்திமடல்",
    FR: "Journal Privé",
  },
  "footer.rights": {
    EN: "All rights reserved.",
    SI: "සියලු හිමිකම් ඇවිරිණි.",
    TA: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
    FR: "Tous droits réservés.",
  },
  "footer.privacy": {
    EN: "Privacy Policy",
    SI: "රහස්‍යතා ප්‍රතිපත්තිය",
    TA: "தனியுரிமைக் கொள்கை",
    FR: "Politique de Confidentialité",
  },
  "footer.terms": {
    EN: "Terms of Service",
    SI: "සේවා කොන්දේසි",
    TA: "சேவை விதிமுறைகள்",
    FR: "Conditions Générales",
  },

  // Common
  "common.back": {
    EN: "Back",
    SI: "ආපසු",
    TA: "பின்செல்",
    FR: "Retour",
  },
  "common.close": {
    EN: "Close",
    SI: "වසන්න",
    TA: "மூடுக",
    FR: "Fermer",
  },
  "common.loading": {
    EN: "Loading...",
    SI: "පූරණය වෙමින්...",
    TA: "ஏற்றப்படுகிறது...",
    FR: "Chargement...",
  },
  "common.viewDetails": {
    EN: "View Details",
    SI: "විස්තර බලන්න",
    TA: "விவரங்களை பார்க்க",
    FR: "Voir Détails",
  },
};

export const CURRENCY_RATES: Record<
  Currency,
  {
    code: Currency;
    label: string;
    symbol: string;
    rateFromLKR: number;
    format: (amountLKR: number) => string;
  }
> = {
  LKR: {
    code: "LKR",
    label: "LKR — Sri Lankan Rupee",
    symbol: "LKR ",
    rateFromLKR: 1,
    format: (amountLKR: number) => `LKR ${Math.round(amountLKR).toLocaleString()}`,
  },
  USD: {
    code: "USD",
    label: "USD — US Dollar",
    symbol: "$",
    rateFromLKR: 1 / 300,
    format: (amountLKR: number) => {
      const val = amountLKR / 300;
      return `$${val >= 100 ? Math.round(val).toLocaleString() : val.toFixed(2)}`;
    },
  },
  EUR: {
    code: "EUR",
    label: "EUR — Euro",
    symbol: "€",
    rateFromLKR: 1 / 330,
    format: (amountLKR: number) => {
      const val = amountLKR / 330;
      return `€${val >= 100 ? Math.round(val).toLocaleString() : val.toFixed(2)}`;
    },
  },
  GBP: {
    code: "GBP",
    label: "GBP — British Pound",
    symbol: "£",
    rateFromLKR: 1 / 390,
    format: (amountLKR: number) => {
      const val = amountLKR / 390;
      return `£${val >= 100 ? Math.round(val).toLocaleString() : val.toFixed(2)}`;
    },
  },
};
