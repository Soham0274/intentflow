import { calculateDistance, formatDistance, Coordinates } from './location';
import * as api from './api';

export interface LocationRecommendation {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
  distance?: number; // in meters
  formattedDistance?: string;
}

// Keyword categories for matching
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  grocery: ['grocery', 'supermarket', 'whole foods', 'trader joe', 'kroger', 'safeway', 'aldi', 'publix'],
  stationery: ['stationery', 'office supplies', 'staples', 'paper', 'pens', 'printer'],
  sweets: ['sweets', 'bakery', 'dessert', 'candy', 'donut', 'cake', 'pastry', 'chocolate'],
  fastfood: ['fast food', 'burger', 'pizza', 'taco', 'quick', 'mcdonald', 'wendy', 'kfc', 'subway'],
  cafes: ['cafe', 'coffee', 'starbucks', 'espresso', 'latte', 'cappuccino', 'tea'],
  restaurants: ['restaurant', 'dining', 'eat out', 'food', 'lunch', 'dinner', 'brunch'],
  pharmacy: ['pharmacy', 'drugstore', 'cvs', 'walgreens', 'rite aid', 'medicine'],
  gas: ['gas', 'gas station', 'fuel', 'shell', 'bp', 'exxon', 'mobil'],
  bank: ['bank', 'atm', 'credit union', 'chase', 'wells fargo'],
};

// OSM tag mappings for LocationIQ nearby search
const CATEGORY_TAGS: Record<string, string> = {
  grocery: 'supermarket',
  stationery: 'stationery',
  sweets: 'bakery',
  fastfood: 'fast_food',
  cafes: 'cafe',
  restaurants: 'restaurant',
  pharmacy: 'pharmacy',
  gas: 'fuel',
  bank: 'bank',
};

// Popular chains by category (fallback/mock data)
// Supports multiple regions - US, India, UK, etc.
const POPULAR_CHAINS: Record<string, Array<{ name: string; icon: string }>> = {
  grocery: [
    { name: 'Whole Foods Market', icon: '🥬' },
    { name: 'Trader Joe\'s', icon: '🛒' },
    { name: 'DMart', icon: '🛒' },         // India
    { name: 'BigBasket', icon: '🥬' },      // India
    { name: 'Spencer\'s', icon: '🛒' },    // India
    { name: 'Reliance Fresh', icon: '🥬' }, // India
    { name: 'More', icon: '🛒' },          // India
    { name: 'Nature\'s Basket', icon: '🥬' }, // India
    { name: 'Aldi', icon: '🛒' },
    { name: 'Tesco', icon: '🛒' },         // UK
  ],
  stationery: [
    { name: 'Staples', icon: '✂️' },
    { name: 'Office Depot', icon: '📎' },
    { name: 'Crossword', icon: '📚' },     // India
    { name: 'Landmark', icon: '✂️' },      // India
  ],
  sweets: [
    { name: 'Dunkin\' Donuts', icon: '🍩' },
    { name: 'Krispy Kreme', icon: '🍩' },
    { name: 'Haldiram\'s', icon: '🍬' },   // India
    { name: 'Bikanervala', icon: '🍬' },   // India
    { name: 'Keventers', icon: '🥛' },      // India
    { name: 'KC Das', icon: '🍰' },        // India
  ],
  fastfood: [
    { name: 'McDonald\'s', icon: '🍔' },
    { name: 'KFC', icon: '🐔' },
    { name: 'Burger King', icon: '🍔' },
    { name: 'Subway', icon: '🥪' },
    { name: 'Domino\'s Pizza', icon: '🍕' },
    { name: 'Pizza Hut', icon: '🍕' },
    { name: 'Faasos', icon: '🌯' },        // India
    { name: 'Chaayos', icon: '🍵' },       // India
    { name: 'Wow! Momo', icon: '🥟' },      // India
  ],
  cafes: [
    { name: 'Starbucks', icon: '☕' },
    { name: 'Costa Coffee', icon: '☕' },
    { name: 'Café Coffee Day', icon: '☕' }, // India
    { name: 'Barista', icon: '☕' },         // India
    { name: 'Third Wave Coffee', icon: '☕' }, // India
    { name: 'Blue Tokai', icon: '☕' },     // India
    { name: 'Roastery Coffee', icon: '☕' }, // India
  ],
  restaurants: [
    { name: 'Olive Garden', icon: '🍝' },
    { name: 'Barbeque Nation', icon: '�' }, // India
    { name: 'Mainland China', icon: '🥢' },   // India
    { name: 'Punjabi By Nature', icon: '🍛' }, // India
    { name: 'Biryani Blues', icon: '🍚' },    // India
    { name: 'Paradise Biryani', icon: '�' }, // India
  ],
  pharmacy: [
    { name: 'CVS Pharmacy', icon: '💊' },
    { name: 'Walgreens', icon: '💊' },
    { name: 'Apollo Pharmacy', icon: '💊' },   // India
    { name: 'MedPlus', icon: '💊' },          // India
    { name: 'Netmeds', icon: '💊' },         // India
    { name: '1mg', icon: '💊' },              // India
  ],
  gas: [
    { name: 'Shell', icon: '⛽' },
    { name: 'BP', icon: '⛽' },
    { name: 'Indian Oil', icon: '⛽' },      // India
    { name: 'BPCL', icon: '⛽' },             // India Bharat Petroleum
    { name: 'HPCL', icon: '⛽' },             // India Hindustan Petroleum
    { name: 'Reliance Petroleum', icon: '⛽' }, // India
  ],
  bank: [
    { name: 'Chase Bank', icon: '🏦' },
    { name: 'State Bank of India', icon: '🏦' }, // India
    { name: 'HDFC Bank', icon: '🏦' },           // India
    { name: 'ICICI Bank', icon: '🏦' },          // India
    { name: 'Axis Bank', icon: '🏦' },           // India
    { name: 'Kotak Mahindra', icon: '🏦' },      // India
    { name: 'Bank of America', icon: '🏦' },
  ],
};

/**
 * Detect all matching categories from input text
 * Returns array of category keys or empty array if no matches
 */
export function detectCategories(input: string): string[] {
  const lowerInput = input.toLowerCase();
  const matches: string[] = [];
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        if (!matches.includes(category)) {
          matches.push(category);
        }
        break; // Found a match for this category, move to next
      }
    }
  }
  
  return matches;
}

/**
 * Detect single category from input text (backward compatibility)
 * Returns the category key or null if no match
 * @deprecated Use detectCategories() for multiple category support
 */
export function detectCategory(input: string): string | null {
  const categories = detectCategories(input);
  return categories.length > 0 ? categories[0] : null;
}

/**
 * Get recommendations for a category near the user's location
 * Uses LocationIQ API via backend proxy when available, falls back to popular chains
 */
export async function getRecommendations(
  category: string,
  userLocation: Coordinates,
  radius: number = 5000, // meters
  limit: number = 10    // Configurable limit, default 10
): Promise<LocationRecommendation[]> {
  try {
    const recommendations = await fetchLocationIQRecommendations(
      category,
      userLocation,
      radius
    );
    if (recommendations.length > 0) {
      return recommendations.slice(0, limit);
    }
  } catch (err) {
    console.warn('[LocationRecommendations] API fetch failed, using fallback:', err);
  }

  // Fallback to popular chains with simulated distances
  const fallback = getFallbackRecommendations(category, userLocation);
  return fallback.slice(0, limit);
}

/**
 * Get recommendations for MULTIPLE categories near user's location
 * This enables showing cafes, restaurants, shops, etc. all at once
 */
export async function getRecommendationsForCategories(
  categories: string[],
  userLocation: Coordinates,
  radius: number = 5000,
  totalLimit: number = 20
): Promise<LocationRecommendation[]> {
  const allRecommendations: LocationRecommendation[] = [];
  
  // Get recommendations for each category
  for (const category of categories) {
    try {
      const categoryResults = await getRecommendations(
        category,
        userLocation,
        radius,
        5 // Get up to 5 per category
      );
      
      // Add category label to each result
      const labeledResults = categoryResults.map(r => ({
        ...r,
        categoryLabel: getCategoryInfo(category).label,
      }));
      
      allRecommendations.push(...labeledResults);
    } catch (err) {
      console.warn(`[LocationRecommendations] Failed to get ${category}:`, err);
    }
  }
  
  // Sort by distance and limit total results
  return allRecommendations
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, totalLimit);
}

/**
 * Fetch recommendations from backend proxy using nearby search
 */
async function fetchLocationIQRecommendations(
  category: string,
  userLocation: Coordinates,
  radius: number
): Promise<LocationRecommendation[]> {
  try {
    // Get tags for this category
    const tags = CATEGORY_TAGS[category] || 'amenity';
    
    // radius in meters
    const radiusMeters = Math.min(radius * 1000, 5000); // Max 5km
    
    const data = await api.fetchNearbyPOIs(
      userLocation.latitude,
      userLocation.longitude,
      tags,
      radiusMeters
    );
    
    // Handle both single result (object) and multiple results (array)
    const places = Array.isArray(data) ? data : data ? [data] : [];
    
    if (places.length === 0) {
      console.log('[LocationIQ Proxy] No POIs found nearby, using reverse fallback');
      return fetchLocationIQReverseFallback(category, userLocation);
    }

    // Map places to recommendations
    const recommendations: LocationRecommendation[] = places.map((place: any, index: number) => {
      const placeLat = parseFloat(place.lat);
      const placeLon = parseFloat(place.lon);
      const distance = calculateDistance(userLocation.latitude, userLocation.longitude, placeLat, placeLon);
      
      return {
        id: place.place_id || `loc-${Date.now()}-${index}`,
        name: place.name || place.display_name?.split(',')[0] || 'Unknown Place',
        category: category,
        lat: placeLat,
        lng: placeLon,
        address: place.display_name,
        distance: distance,
        formattedDistance: formatDistance(distance),
      };
    });

    recommendations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    return recommendations;
  } catch (err) {
    console.error('[LocationIQ Proxy] Error fetching nearby locations:', err);
    return fetchLocationIQReverseFallback(category, userLocation);
  }
}

/**
 * Fallback using reverse geocoding via backend proxy
 */
async function fetchLocationIQReverseFallback(
  category: string,
  userLocation: Coordinates
): Promise<LocationRecommendation[]> {
  try {
    const data = await api.reverseGeocode(userLocation.latitude, userLocation.longitude);
    
    if (!data || !data.display_name) {
      return [];
    }

    return [{
      id: data.place_id || `loc-${Date.now()}`,
      name: data.name || data.display_name?.split(',')[0] || 'Current Location',
      category: category,
      lat: parseFloat(data.lat) || userLocation.latitude,
      lng: parseFloat(data.lon) || userLocation.longitude,
      address: data.display_name,
      distance: 0,
      formattedDistance: 'Here',
    }];
  } catch (err) {
    console.error('[LocationIQ Proxy Fallback] Error:', err);
    return [];
  }
}

/**
 * Get fallback recommendations (popular chains with simulated distances)
 */
function getFallbackRecommendations(
  category: string,
  userLocation: Coordinates
): LocationRecommendation[] {
  const chains = POPULAR_CHAINS[category] || [];
  
  // Generate realistic-looking offsets from user location
  return chains.map((chain, index) => {
    // Simulate locations within ~2km radius
    const offsetLat = (Math.random() - 0.5) * 0.036; // ~2km in degrees
    const offsetLng = (Math.random() - 0.5) * 0.036 / Math.cos(userLocation.latitude * Math.PI / 180);
    
    const lat = userLocation.latitude + offsetLat;
    const lng = userLocation.longitude + offsetLng;
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      lat,
      lng
    );

    return {
      id: `fallback-${category}-${index}`,
      name: chain.name,
      category: category,
      lat,
      lng,
      distance,
      formattedDistance: formatDistance(distance),
    };
  }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

/**
 * Quick check if input contains any category keywords
 */
export function hasCategoryKeywords(input: string): boolean {
  return detectCategory(input) !== null;
}

/**
 * Get all available categories
 */
export function getAvailableCategories(): string[] {
  return Object.keys(CATEGORY_KEYWORDS);
}

/**
 * Get category display info
 */
export function getCategoryInfo(category: string): { label: string; icon: string } {
  const icons: Record<string, string> = {
    grocery: '🛒',
    stationery: '✂️',
    sweets: '🍩',
    fastfood: '🍔',
    cafes: '☕',
    restaurants: '🍽️',
    pharmacy: '💊',
    gas: '⛽',
    bank: '🏦',
  };

  return {
    label: category.charAt(0).toUpperCase() + category.slice(1),
    icon: icons[category] || '📍',
  };
}
