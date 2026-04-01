export interface VendorProduct {
  vendor: string;
  quantity: number;
  base_price: number;
  map_price: number;
  msrp_price: number;
}

export interface Product {
  id: number;
  sku: string;
  title: string;
  brand: string;
  upc: string;
  category: string;
  subcategory: string;
  base_price: number;
  map_price: number;
  msrp: number;
  stock_count: number;
  description: string;
  images: string[];
  vendor_products: VendorProduct[];
  shopify_synced: boolean;
  status: "active" | "inactive";
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1, sku: "TRK-DOM-SL5-RD", title: "Trek Domane SL 5", brand: "Trek", upc: "601479300123",
    category: "Complete Bikes", subcategory: "Road Bikes",
    base_price: 2800, map_price: 3200, msrp: 3499, stock_count: 3,
    description: "Endurance road bike with IsoSpeed technology for a smoother ride.",
    images: [], shopify_synced: true, status: "active",
    vendor_products: [
      { vendor: "Trek Direct", quantity: 2, base_price: 2800, map_price: 3200, msrp_price: 3499 },
      { vendor: "Bike Warehouse", quantity: 1, base_price: 2850, map_price: 3200, msrp_price: 3499 },
    ],
  },
  {
    id: 2, sku: "SHM-105-GS", title: "Shimano 105 Rear Derailleur", brand: "Shimano", upc: "689228800456",
    category: "Components", subcategory: "Drivetrain",
    base_price: 45, map_price: 55, msrp: 64.99, stock_count: 18,
    description: "11-speed rear derailleur for road cycling.",
    images: [], shopify_synced: true, status: "active",
    vendor_products: [
      { vendor: "QBP", quantity: 12, base_price: 45, map_price: 55, msrp_price: 64.99 },
      { vendor: "J&B Importers", quantity: 6, base_price: 47, map_price: 55, msrp_price: 64.99 },
    ],
  },
  {
    id: 3, sku: "CNT-GP5000-700", title: "Continental GP5000 700x25c", brand: "Continental", upc: "401789500789",
    category: "Tires & Tubes", subcategory: "Road Tires",
    base_price: 52, map_price: 65, msrp: 79.95, stock_count: 42,
    description: "Premium road tire with BlackChili compound and Vectran breaker.",
    images: [], shopify_synced: true, status: "active",
    vendor_products: [
      { vendor: "QBP", quantity: 30, base_price: 52, map_price: 65, msrp_price: 79.95 },
      { vendor: "J&B Importers", quantity: 12, base_price: 54, map_price: 65, msrp_price: 79.95 },
    ],
  },
  {
    id: 4, sku: "SRM-TBE-PV-26", title: "Tube PV 26x1.5-2.5", brand: "Serfas", upc: "501234600111",
    category: "Tires & Tubes", subcategory: "Tubes",
    base_price: 4.50, map_price: 6, msrp: 7.99, stock_count: 85,
    description: "Standard Presta valve inner tube for 26-inch wheels.",
    images: [], shopify_synced: true, status: "active",
    vendor_products: [
      { vendor: "QBP", quantity: 60, base_price: 4.50, map_price: 6, msrp_price: 7.99 },
      { vendor: "Bike Warehouse", quantity: 25, base_price: 4.75, map_price: 6, msrp_price: 7.99 },
    ],
  },
  {
    id: 5, sku: "SHM-XT-BRK-F", title: "Shimano XT Brake Set (Front)", brand: "Shimano", upc: "689228800222",
    category: "Components", subcategory: "Brakes",
    base_price: 85, map_price: 110, msrp: 129.99, stock_count: 7,
    description: "Hydraulic disc brake for mountain and gravel riding.",
    images: [], shopify_synced: false, status: "active",
    vendor_products: [
      { vendor: "QBP", quantity: 5, base_price: 85, map_price: 110, msrp_price: 129.99 },
      { vendor: "Trek Direct", quantity: 2, base_price: 88, map_price: 110, msrp_price: 129.99 },
    ],
  },
  {
    id: 6, sku: "FZK-PRO-HLM-M", title: "Fizik Tempo Helmet M", brand: "Fizik", upc: "701234500333",
    category: "Accessories", subcategory: "Helmets",
    base_price: 68, map_price: 89, msrp: 99.99, stock_count: 0,
    description: "Lightweight road helmet with MIPS protection.",
    images: [], shopify_synced: true, status: "active",
    vendor_products: [
      { vendor: "J&B Importers", quantity: 0, base_price: 68, map_price: 89, msrp_price: 99.99 },
    ],
  },
  {
    id: 7, sku: "PRK-TL-HEX-ST", title: "Park Tool Hex Wrench Set", brand: "Park Tool", upc: "801234500444",
    category: "Tools", subcategory: "Hand Tools",
    base_price: 22, map_price: 30, msrp: 34.95, stock_count: 15,
    description: "Professional hex wrench set for bike maintenance.",
    images: [], shopify_synced: false, status: "active",
    vendor_products: [
      { vendor: "QBP", quantity: 15, base_price: 22, map_price: 30, msrp_price: 34.95 },
    ],
  },
  {
    id: 8, sku: "SPZ-TARMAC-SL7", title: "Specialized Tarmac SL7 Frameset", brand: "Specialized", upc: "901234500555",
    category: "Frames", subcategory: "Road Frames",
    base_price: 2200, map_price: 2800, msrp: 3200, stock_count: 1,
    description: "Aero road frameset with FACT 11r carbon construction.",
    images: [], shopify_synced: true, status: "active",
    vendor_products: [
      { vendor: "Specialized Direct", quantity: 1, base_price: 2200, map_price: 2800, msrp_price: 3200 },
    ],
  },
];

export const CATEGORIES = [...new Set(MOCK_PRODUCTS.map((p) => p.category))];

export function getStockStatus(count: number): { label: string; color: "success" | "warning" | "error" } {
  if (count === 0) return { label: "Out of Stock", color: "error" };
  if (count <= 5) return { label: "Low Stock", color: "warning" };
  return { label: "In Stock", color: "success" };
}
