// Walmart Market 36 - Las Vegas Store Registry
// All 9 stores in the Las Vegas market area

export interface Store {
  id: string;
  storeNumber: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  phone: string;
  format: 'Supercenter' | 'Neighborhood Market';
  sections: SectionKey[];
}

export type SectionKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K';

export interface Section {
  key: SectionKey;
  name: string;
  description: string;
  icon: string;
}

// Section definitions for store operations
export const SECTIONS: Section[] = [
  { key: 'A', name: 'Fresh', description: 'Produce, Bakery, Deli, Meat', icon: 'Apple' },
  { key: 'B', name: 'Consumables', description: 'Grocery, Pets, Paper, Chemicals', icon: 'ShoppingBasket' },
  { key: 'C', name: 'Health & Wellness', description: 'Pharmacy, OTC, Beauty, Personal Care', icon: 'Heart' },
  { key: 'D', name: 'General Merchandise', description: 'Apparel, Home, Hardlines', icon: 'Package' },
  { key: 'E', name: 'Entertainment', description: 'Electronics, Wireless, Photo', icon: 'Tv' },
  { key: 'F', name: 'Financial Services', description: 'Money Center, Service Desk', icon: 'DollarSign' },
  { key: 'G', name: 'Front End', description: 'Registers, Self-Checkout, Cart Pushers', icon: 'ShoppingCart' },
  { key: 'H', name: 'OGP/Digital', description: 'Online Grocery Pickup, Delivery', icon: 'Truck' },
  { key: 'I', name: 'Inventory', description: 'Backroom, Claims, Receiving', icon: 'Warehouse' },
  { key: 'J', name: 'Asset Protection', description: 'Security, Shrink Prevention', icon: 'Shield' },
  { key: 'K', name: 'People', description: 'Associates, Scheduling, Training', icon: 'Users' },
];

// Market 36 Las Vegas Walmart Stores
export const MARKET_36_STORES: Store[] = [
  {
    id: 'store-2050',
    storeNumber: 2050,
    name: 'Walmart Supercenter - Charleston',
    address: '4505 W Charleston Blvd',
    city: 'Las Vegas',
    state: 'NV',
    zipCode: '89102',
    coordinates: { lat: 36.1583, lng: -115.1914 },
    phone: '(702) 878-0347',
    format: 'Supercenter',
    sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
  },
  {
    id: 'store-3455',
    storeNumber: 3455,
    name: 'Walmart Supercenter - Tropicana',
    address: '5198 S Fort Apache Rd',
    city: 'Las Vegas',
    state: 'NV',
    zipCode: '89148',
    coordinates: { lat: 36.0994, lng: -115.2969 },
    phone: '(702) 253-7578',
    format: 'Supercenter',
    sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
  },
  {
    id: 'store-2052',
    storeNumber: 2052,
    name: 'Walmart Supercenter - Flamingo',
    address: '4350 N Nellis Blvd',
    city: 'Las Vegas',
    state: 'NV',
    zipCode: '89115',
    coordinates: { lat: 36.1988, lng: -115.0627 },
    phone: '(702) 643-1770',
    format: 'Supercenter',
    sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
  },
  {
    id: 'store-5095',
    storeNumber: 5095,
    name: 'Walmart Supercenter - Decatur',
    address: '6464 N Decatur Blvd',
    city: 'Las Vegas',
    state: 'NV',
    zipCode: '89131',
    coordinates: { lat: 36.2738, lng: -115.2083 },
    phone: '(702) 515-1152',
    format: 'Supercenter',
    sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
  },
  {
    id: 'store-3566',
    storeNumber: 3566,
    name: 'Walmart Supercenter - Blue Diamond',
    address: '7200 Arroyo Crossing Pkwy',
    city: 'Las Vegas',
    state: 'NV',
    zipCode: '89113',
    coordinates: { lat: 36.0678, lng: -115.2753 },
    phone: '(702) 361-4410',
    format: 'Supercenter',
    sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
  },
  {
    id: 'store-1574',
    storeNumber: 1574,
    name: 'Walmart Supercenter - Craig',
    address: '1807 W Craig Rd',
    city: 'North Las Vegas',
    state: 'NV',
    zipCode: '89032',
    coordinates: { lat: 36.2389, lng: -115.1597 },
    phone: '(702) 657-0214',
    format: 'Supercenter',
    sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
  },
  {
    id: 'store-4215',
    storeNumber: 4215,
    name: 'Walmart Supercenter - Centennial',
    address: '6310 N Simmons St',
    city: 'North Las Vegas',
    state: 'NV',
    zipCode: '89031',
    coordinates: { lat: 36.2714, lng: -115.1484 },
    phone: '(702) 633-0605',
    format: 'Supercenter',
    sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
  },
  {
    id: 'store-5101',
    storeNumber: 5101,
    name: 'Walmart Supercenter - Henderson',
    address: '540 Marks St',
    city: 'Henderson',
    state: 'NV',
    zipCode: '89014',
    coordinates: { lat: 36.0300, lng: -115.0333 },
    phone: '(702) 435-7497',
    format: 'Supercenter',
    sections: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
  },
  {
    id: 'store-3782',
    storeNumber: 3782,
    name: 'Walmart Neighborhood Market - Sahara',
    address: '8060 W Sahara Ave',
    city: 'Las Vegas',
    state: 'NV',
    zipCode: '89117',
    coordinates: { lat: 36.1448, lng: -115.2541 },
    phone: '(702) 944-0043',
    format: 'Neighborhood Market',
    sections: ['A', 'B', 'C', 'G', 'H', 'I', 'J', 'K'],
  },
];

// Helper function to get store by ID
export function getStoreById(id: string): Store | undefined {
  return MARKET_36_STORES.find(store => store.id === id);
}

// Helper function to get store by store number
export function getStoreByNumber(storeNumber: number): Store | undefined {
  return MARKET_36_STORES.find(store => store.storeNumber === storeNumber);
}

// Helper function to get section by key
export function getSectionByKey(key: SectionKey): Section | undefined {
  return SECTIONS.find(section => section.key === key);
}

// Get all supercenters
export function getSupercenters(): Store[] {
  return MARKET_36_STORES.filter(store => store.format === 'Supercenter');
}

// Get all neighborhood markets
export function getNeighborhoodMarkets(): Store[] {
  return MARKET_36_STORES.filter(store => store.format === 'Neighborhood Market');
}
