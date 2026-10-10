export type PageRoute = 'home' | 'shop' | 'about' | 'find-us' | 'cart';

export interface FlavorItem {
  id: string;
  name: string;
  headlineTitle: string;
  subtitle: string;
  headlineSerif: string;
  category: string;
  priceOneTime: number;
  priceSubscribe: number;
  tastingNotesShort: string;
  tastingNotes: string[];
  description: string;
  bgGradient: string; // for the card styling
  colorTheme: {
    accent: string;
    subtle: string;
    text: string;
    cardBg: string;
  };
  functionalPills: string[];
  imageUrl: string;
  canThumbnailUrl?: string;
  servingSize: string;
  nutrition: {
    calories: number;
    totalFat: string;
    saturatedFat: string;
    transFat: string;
    cholesterol: string;
    sodium: string;
    totalCarb: string;
    dietaryFiber: string;
    totalSugars: string;
    addedSugars: string;
    protein: string;
    calcium: string;
  };
  ingredientsText: string;
  descriptionDetailed: string;
  inStock: boolean;
  gradient: [string, string, string]; // shop-page backdrop: top, middle, bottom
  tint: string; // solid flavour colour used for page tint
  abbr: string; // 3-letter code shown on product cards
  coordinates: string; // flavour 'origin' shown on product cards
}

export interface CartItem {
  flavor: FlavorItem;
  packSize: '6-pack' | '12-pack';
  purchaseType: 'one-time' | 'subscribe';
  quantity: number;
}
