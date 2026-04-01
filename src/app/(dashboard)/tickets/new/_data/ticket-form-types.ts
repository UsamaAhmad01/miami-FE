export interface CatalogService {
  id: number;
  name: string;
  price: number;
  taxable: boolean;
}

export interface CatalogMechanic {
  id: number;
  name: string;
}

export interface CatalogInventoryItem {
  id: string;
  description: string;
  upc_ean: string;
  quantity: number;
  unit_price: number;
}

export interface Pricing {
  tax: number;
  service_charge: number;
  shipping: number;
}

// Cart item types
export interface CartService {
  service_id: number;
  name: string;
  price: number; // includes processing fee
  original_price: number;
  taxable: boolean;
}

export interface CartCustomItem {
  id: string;
  name: string;
  price: number; // includes processing fee
  original_price: number;
  quantity: number;
  taxable: boolean;
}

export interface CartInventoryItem {
  item_id: string;
  item_name: string;
  upc_ean: string;
  price: number; // includes processing fee
  original_price: number;
  quantity: number;
  taxable: boolean;
}

export interface BikeCart {
  bike_id: number;
  bike_name: string;
  services: CartService[];
  custom_items: CartCustomItem[];
  inventory_items: CartInventoryItem[];
}

export type PaymentMethod = "cash" | "credit_card" | "zelle" | "partial";

export interface TicketFormState {
  // Customer
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_email: string;
  description: string;

  // Order
  delivery_date: string;
  mechanic: string;
  special_order: boolean;
  notes: string;

  // Payment
  payment_method: PaymentMethod | "";
  validated_by: string;
  deposit_amount: string;
  discount_code: string;
  partial_cash_amount: string;

  // Cart
  multi_bike: boolean;
  bikes: BikeCart[];

  // Single-mode cart (when multi_bike=false, uses bikes[0])
}

export function applyProcessingFee(price: number | string, serviceCharge: number | string): number {
  const p = parseFloat(String(price)) || 0;
  const sc = parseFloat(String(serviceCharge)) || 0;
  return p + (p * sc / 100);
}

export function calculateTotals(bikes: BikeCart[], pricing: Pricing) {
  let subtotal = 0;
  let taxableTotal = 0;

  for (const bike of bikes) {
    for (const svc of bike.services) {
      subtotal += svc.price;
      if (svc.taxable) taxableTotal += svc.price;
    }
    for (const item of bike.custom_items) {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;
      if (item.taxable) taxableTotal += lineTotal;
    }
    for (const item of bike.inventory_items) {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;
      if (item.taxable) taxableTotal += lineTotal;
    }
  }

  const taxAmount = taxableTotal * (pricing.tax / 100);
  const finalTotal = subtotal + taxAmount;

  return { subtotal, taxableTotal, taxAmount, finalTotal };
}
