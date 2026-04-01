export interface PosItem {
  id: string;
  name: string;
  type: "service" | "product";
  price: number;
  quantity: number;
  taxable: boolean;
}

export interface PosCustomer {
  name: string;
  phone: string;
  email: string;
}

export const MOCK_SERVICES = [
  { id: "svc-1", name: "Full Tune-Up", price: 95 },
  { id: "svc-2", name: "Brake Bleed", price: 45 },
  { id: "svc-3", name: "Chain Replacement", price: 35 },
  { id: "svc-4", name: "Tire Change", price: 25 },
  { id: "svc-5", name: "Wheel Alignment", price: 30 },
  { id: "svc-6", name: "Brake Replacement", price: 65 },
  { id: "svc-7", name: "Cable Replacement", price: 40 },
  { id: "svc-8", name: "Flat Repair", price: 15 },
  { id: "svc-9", name: "Headset Service", price: 50 },
  { id: "svc-10", name: "Bottom Bracket", price: 60 },
];

export const MOCK_PRODUCTS = [
  { id: "prd-1", name: "Continental GP5000 700x25c", price: 79.95 },
  { id: "prd-2", name: "Tube PV 26x1.5-2.5", price: 7.99 },
  { id: "prd-3", name: "Shimano 105 Chain", price: 34.99 },
  { id: "prd-4", name: "Park Tool Hex Set", price: 34.95 },
  { id: "prd-5", name: "Brake Pads (Shimano)", price: 24.99 },
  { id: "prd-6", name: "Bar Tape (Lizard Skins)", price: 39.99 },
];

export const TAX_RATE = 0.07;
