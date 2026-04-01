import type { CatalogService, CatalogMechanic, CatalogInventoryItem, Pricing } from "./ticket-form-types";

export const MOCK_SERVICES: CatalogService[] = [
  { id: 1, name: "Full Tune-Up", price: 95, taxable: true },
  { id: 2, name: "Brake Bleed", price: 45, taxable: true },
  { id: 3, name: "Chain Replacement", price: 35, taxable: true },
  { id: 4, name: "Tire Change", price: 25, taxable: true },
  { id: 5, name: "Wheel Alignment", price: 30, taxable: true },
  { id: 6, name: "Brake Replacement", price: 65, taxable: true },
  { id: 7, name: "Cable Replacement", price: 40, taxable: true },
  { id: 8, name: "Chain & Gear Service", price: 55, taxable: true },
  { id: 9, name: "Wheel Truing", price: 35, taxable: true },
  { id: 10, name: "Headset Service", price: 50, taxable: true },
  { id: 11, name: "Bottom Bracket Service", price: 60, taxable: true },
  { id: 12, name: "Wheel Build", price: 120, taxable: true },
  { id: 13, name: "Electronic Shifting Calibration", price: 75, taxable: true },
  { id: 14, name: "Flat Repair", price: 15, taxable: true },
];

export const MOCK_MECHANICS: CatalogMechanic[] = [
  { id: 1, name: "Marco Silva" },
  { id: 2, name: "Alex Torres" },
  { id: 3, name: "Jordan Lee" },
];

export const MOCK_INVENTORY: CatalogInventoryItem[] = [
  { id: "inv-1", description: "Inner Tube PV 26\"", upc_ean: "501234600111", quantity: 85, unit_price: 5.99 },
  { id: "inv-2", description: "Continental GP5000 700x25c", upc_ean: "401789500789", quantity: 42, unit_price: 52.00 },
  { id: "inv-3", description: "Shimano 105 Chain", upc_ean: "689228800333", quantity: 28, unit_price: 28.99 },
  { id: "inv-4", description: "Brake Pads (Shimano)", upc_ean: "689228800444", quantity: 36, unit_price: 18.99 },
  { id: "inv-5", description: "Bar Tape (Lizard Skins)", upc_ean: "701234500555", quantity: 24, unit_price: 32.99 },
  { id: "inv-6", description: "Shimano XT Brake Set", upc_ean: "689228800222", quantity: 7, unit_price: 85.00 },
  { id: "inv-7", description: "Park Tool Hex Set", upc_ean: "801234500444", quantity: 15, unit_price: 22.00 },
  { id: "inv-8", description: "Derailleur Hanger Universal", upc_ean: "901234500666", quantity: 20, unit_price: 12.99 },
];

export const MOCK_PRICING: Pricing = {
  tax: 7.0,
  service_charge: 3.0,
  shipping: 0,
};
