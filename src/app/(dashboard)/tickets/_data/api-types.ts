// Types matching the real API response from GET /crm/bike-tickets/by_invoice_number/
// and GET /crm/tickets/branch/{branch}/

export interface ApiTicket {
  id?: number;
  automatic_generated_invoice_number: string;
  name: string;
  phone_no: string;
  description: string;
  delivery_date: string;
  status: string;
  validated_by: string;
  total_price: number | string; // API may return string
  total_services_price?: number | string;
  credited_amount: number | string;
  discount_amount: number | string;
  discount_percentage?: number | string;
  discount_code?: string;
  payment_status: string;
  services: Array<{ id: number; name: string; price: number; total_price?: number | string; taxable?: boolean; quantity?: number; tax?: number }>;
  custom_services: Array<{ name: string; price: number; quantity: number; taxable?: boolean; total_price?: number | string; tax?: number }>;
  inventory_items: Array<{ item_id: string; item_name: string; quantity: number; price: number; upc_ean: string; taxable?: boolean; name?: string }>;
  enable_multiple_bikes: boolean;
  // API returns bikes_data (JSONField), NOT bikes
  bikes_data?: { bikes: Array<Record<string, unknown>> } | null;
  // Some list endpoints flatten bikes — keep for backward compat
  bikes?: Array<Record<string, unknown>>;
  is_pos?: boolean;
  email?: string;
  address?: string;
  notes?: string;
  mechanic?: number | string | null;
  special_order?: string;
  payment_option?: string;
  // Pricing saved at creation
  processing_fee_on_creation?: number | null;
  tax_on_creation?: number | null;
  // Stripe
  terminal_payment_enabled?: boolean;
  // Timestamps
  created?: string;
  created_at?: string;
  updated_at?: string;
  // Other
  branch?: number | string;
  active?: boolean;
  img?: string | null;
}

// Normalize status for badge display
export function normalizeStatus(status: string): { label: string; color: "info" | "warning" | "success" | "error" | "neutral" } {
  const s = status?.toLowerCase().trim() || "";
  if (s === "completed") return { label: "Completed", color: "success" };
  if (s === "cancelled") return { label: "Cancelled", color: "error" };
  if (s === "pending") return { label: "Pending", color: "warning" };
  if (s.includes("progress")) return { label: "In Progress", color: "info" };
  if (s.includes("ready")) return { label: "Ready", color: "info" };
  return { label: status || "Unknown", color: "neutral" };
}

export function normalizePaymentStatus(status: string): { label: string; color: "success" | "warning" | "error" | "info" | "neutral" } {
  const s = (status || "").toLowerCase().replace(/[\s_]/g, "");
  if (s === "fullypaid" || s === "paid") return { label: "Paid", color: "success" };
  if (s === "partiallypaid" || s === "partial") return { label: "Partial", color: "warning" };
  if (s === "refunded") return { label: "Refunded", color: "info" };
  if (s === "unpaid") return { label: "Unpaid", color: "error" };
  return { label: status || "Unknown", color: "neutral" };
}
