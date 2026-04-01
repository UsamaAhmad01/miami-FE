export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid";

export interface OrderItem {
  sku: string;
  title: string;
  vendor: string;
  quantity: number;
  unit_price: number;
  received: number;
}

export interface Order {
  id: number;
  order_number: string;
  vendor: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  grand_total: number;
  created_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
  notes: string;
}

export const MOCK_ORDERS: Order[] = [
  {
    id: 1, order_number: "PO-2026-001", vendor: "QBP",
    status: "processing", payment_status: "pending",
    items: [
      { sku: "CNT-GP5000-700", title: "Continental GP5000 700x25c", vendor: "QBP", quantity: 20, unit_price: 52, received: 0 },
      { sku: "SHM-105-GS", title: "Shimano 105 Rear Derailleur", vendor: "QBP", quantity: 6, unit_price: 45, received: 0 },
    ],
    subtotal: 1310, tax: 91.70, shipping: 25, grand_total: 1426.70,
    created_at: "2026-03-22T10:00:00", shipped_at: null, delivered_at: null, notes: "Rush order for upcoming season.",
  },
  {
    id: 2, order_number: "PO-2026-002", vendor: "J&B Importers",
    status: "shipped", payment_status: "paid",
    items: [
      { sku: "FZK-PRO-HLM-M", title: "Fizik Tempo Helmet M", vendor: "J&B Importers", quantity: 8, unit_price: 68, received: 0 },
    ],
    subtotal: 544, tax: 38.08, shipping: 15, grand_total: 597.08,
    created_at: "2026-03-18T14:00:00", shipped_at: "2026-03-20T09:00:00", delivered_at: null, notes: "Tracking: 1Z999AA10123456784",
  },
  {
    id: 3, order_number: "PO-2026-003", vendor: "Trek Direct",
    status: "delivered", payment_status: "paid",
    items: [
      { sku: "TRK-DOM-SL5-RD", title: "Trek Domane SL 5", vendor: "Trek Direct", quantity: 2, unit_price: 2800, received: 2 },
    ],
    subtotal: 5600, tax: 392, shipping: 0, grand_total: 5992,
    created_at: "2026-03-10T08:00:00", shipped_at: "2026-03-12T11:00:00", delivered_at: "2026-03-15T14:00:00", notes: "",
  },
  {
    id: 4, order_number: "PO-2026-004", vendor: "Bike Warehouse",
    status: "processing", payment_status: "pending",
    items: [
      { sku: "SRM-TBE-PV-26", title: "Tube PV 26x1.5-2.5", vendor: "Bike Warehouse", quantity: 50, unit_price: 4.75, received: 0 },
      { sku: "SHM-XT-BRK-F", title: "Shimano XT Brake Set (Front)", vendor: "Bike Warehouse", quantity: 4, unit_price: 88, received: 0 },
    ],
    subtotal: 589.50, tax: 41.27, shipping: 18, grand_total: 648.77,
    created_at: "2026-03-23T16:00:00", shipped_at: null, delivered_at: null, notes: "Combine with next month's order if possible.",
  },
];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: "info" | "warning" | "success" | "error" }> = {
  processing: { label: "Processing", color: "info" },
  shipped: { label: "Shipped", color: "warning" },
  delivered: { label: "Delivered", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
};
