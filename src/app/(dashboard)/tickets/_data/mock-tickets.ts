export type TicketStatus = "open" | "in_progress" | "waiting" | "completed" | "cancelled";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type PaymentStatus = "unpaid" | "partially_paid" | "fully_paid";
export type PaymentMethod = "cash" | "credit_card" | "zelle" | "card_present_tap" | "card_present_insert";

export interface Service {
  id: number;
  name: string;
  price: number;
  taxable: boolean;
}

export interface CustomService {
  name: string;
  price: number;
  quantity: number;
  taxable: boolean;
}

export interface BikeEntry {
  bike_id: number;
  make: string;
  model: string;
  color: string;
  serial_number: string;
  services: number[];
  custom_services: CustomService[];
}

export interface Payment {
  id: number;
  payment_type: "full" | "deposit" | "partial" | "final";
  payment_method: PaymentMethod;
  payment_status: "pending" | "processing" | "succeeded" | "failed";
  total_amount: number;
  stripe_fee: number;
  net_amount: number;
  created_at: string;
}

export interface Ticket {
  id: string;
  invoice_number: string;
  customer: { name: string; phone: string; email: string };
  bikes: BikeEntry[];
  services: string[];
  status: TicketStatus;
  priority: TicketPriority;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  technician: string | null;
  created: string;
  due: string | null;
  total: number;
  tax: number;
  total_paid: number;
  balance_due: number;
  notes: string;
  is_pos: boolean;
  payments: Payment[];
}

// Mock services (from /crm/services/ API)
export const MOCK_SERVICES: Service[] = [
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

// Mock mechanics (from /crm/mechanics/ API)
export const MOCK_MECHANICS = [
  { id: 1, name: "Marco Silva" },
  { id: 2, name: "Alex Torres" },
  { id: 3, name: "Jordan Lee" },
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: "TKT-1042",
    invoice_number: "100042",
    customer: { name: "James Rodriguez", phone: "(305) 555-0142", email: "james.r@email.com" },
    bikes: [{ bike_id: 1, make: "Trek", model: "Domane SL 5", color: "Crimson", serial_number: "WTU123456", services: [1, 2, 3], custom_services: [] }],
    services: ["Full Tune-Up", "Brake Bleed", "Chain Replacement"],
    status: "in_progress",
    priority: "high",
    payment_status: "partially_paid",
    payment_method: "credit_card",
    technician: "Marco Silva",
    created: "2026-03-24T09:30:00",
    due: "2026-03-25T17:00:00",
    total: 185,
    tax: 14.80,
    total_paid: 100,
    balance_due: 99.80,
    notes: "Customer requested rush service. Rear derailleur needs attention.",
    is_pos: false,
    payments: [
      { id: 1, payment_type: "deposit", payment_method: "credit_card", payment_status: "succeeded", total_amount: 10000, stripe_fee: 320, net_amount: 9680, created_at: "2026-03-24T09:35:00" },
    ],
  },
  {
    id: "TKT-1041",
    invoice_number: "100041",
    customer: { name: "Sarah Chen", phone: "(305) 555-0198", email: "sarah.c@email.com" },
    bikes: [{ bike_id: 1, make: "Specialized", model: "Tarmac SL7", color: "Black", serial_number: "WSBC789012", services: [6], custom_services: [] }],
    services: ["Brake Replacement"],
    status: "waiting",
    priority: "medium",
    payment_status: "unpaid",
    payment_method: null,
    technician: "Marco Silva",
    created: "2026-03-24T08:15:00",
    due: "2026-03-26T17:00:00",
    total: 120,
    tax: 9.60,
    total_paid: 0,
    balance_due: 129.60,
    notes: "Waiting on brake pad shipment from vendor.",
    is_pos: false,
    payments: [],
  },
  {
    id: "TKT-1040",
    invoice_number: "100040",
    customer: { name: "Mike Thompson", phone: "(305) 555-0167", email: "mike.t@email.com" },
    bikes: [{ bike_id: 1, make: "Giant", model: "Defy Advanced 2", color: "Blue", serial_number: "GNT345678", services: [4, 5], custom_services: [] }],
    services: ["Tire Change", "Wheel Alignment"],
    status: "completed",
    priority: "low",
    payment_status: "fully_paid",
    payment_method: "cash",
    technician: "Alex Torres",
    created: "2026-03-23T14:00:00",
    due: null,
    total: 95,
    tax: 7.60,
    total_paid: 102.60,
    balance_due: 0,
    notes: "Completed ahead of schedule.",
    is_pos: false,
    payments: [
      { id: 2, payment_type: "full", payment_method: "cash", payment_status: "succeeded", total_amount: 10260, stripe_fee: 0, net_amount: 10260, created_at: "2026-03-23T16:00:00" },
    ],
  },
  {
    id: "TKT-1039",
    invoice_number: "100039",
    customer: { name: "Emma Davis", phone: "(305) 555-0211", email: "emma.d@email.com" },
    bikes: [{ bike_id: 1, make: "Cannondale", model: "SuperSix EVO", color: "White", serial_number: "CAN901234", services: [8, 7], custom_services: [] }],
    services: ["Chain & Gear Service", "Cable Replacement"],
    status: "in_progress",
    priority: "medium",
    payment_status: "unpaid",
    payment_method: null,
    technician: "Alex Torres",
    created: "2026-03-23T11:00:00",
    due: "2026-03-25T12:00:00",
    total: 150,
    tax: 12.00,
    total_paid: 0,
    balance_due: 162.00,
    notes: "Shifting issues reported. Full drivetrain inspection needed.",
    is_pos: false,
    payments: [],
  },
  {
    id: "TKT-1038",
    invoice_number: "100038",
    customer: { name: "Carlos Mendez", phone: "(305) 555-0134", email: "carlos.m@email.com" },
    bikes: [{ bike_id: 1, make: "Bianchi", model: "Oltre XR4", color: "Celeste", serial_number: "BNC567890", services: [9], custom_services: [] }],
    services: ["Wheel Truing"],
    status: "completed",
    priority: "low",
    payment_status: "fully_paid",
    payment_method: "card_present_tap",
    technician: "Marco Silva",
    created: "2026-03-22T16:00:00",
    due: null,
    total: 65,
    tax: 5.20,
    total_paid: 70.20,
    balance_due: 0,
    notes: "",
    is_pos: true,
    payments: [
      { id: 3, payment_type: "full", payment_method: "card_present_tap", payment_status: "succeeded", total_amount: 7020, stripe_fee: 230, net_amount: 6790, created_at: "2026-03-22T16:30:00" },
    ],
  },
  {
    id: "TKT-1037",
    invoice_number: "100037",
    customer: { name: "Lisa Park", phone: "(305) 555-0189", email: "lisa.p@email.com" },
    bikes: [{ bike_id: 1, make: "Scott", model: "Addict RC 15", color: "Silver", serial_number: "SCT234567", services: [1, 10], custom_services: [] }],
    services: ["Full Tune-Up", "Headset Service"],
    status: "open",
    priority: "urgent",
    payment_status: "unpaid",
    payment_method: null,
    technician: null,
    created: "2026-03-24T10:45:00",
    due: "2026-03-24T17:00:00",
    total: 210,
    tax: 16.80,
    total_paid: 0,
    balance_due: 226.80,
    notes: "Race tomorrow — needs same-day turnaround.",
    is_pos: false,
    payments: [],
  },
  {
    id: "TKT-1036",
    invoice_number: "100036",
    customer: { name: "David Kim", phone: "(305) 555-0156", email: "david.k@email.com" },
    bikes: [
      { bike_id: 1, make: "Cervélo", model: "R5", color: "Navy", serial_number: "CRV890123", services: [11], custom_services: [] },
      { bike_id: 2, make: "Cervélo", model: "S5", color: "White", serial_number: "CRV890124", services: [4], custom_services: [{ name: "Custom Paint Touch-up", price: 40, quantity: 1, taxable: true }] },
    ],
    services: ["Bottom Bracket Service", "Tire Change"],
    status: "open",
    priority: "medium",
    payment_status: "unpaid",
    payment_method: null,
    technician: null,
    created: "2026-03-24T07:30:00",
    due: "2026-03-26T17:00:00",
    total: 165,
    tax: 13.20,
    total_paid: 0,
    balance_due: 178.20,
    notes: "Creaking noise under load on R5. Touch-up on S5.",
    is_pos: false,
    payments: [],
  },
  {
    id: "TKT-1035",
    invoice_number: "100035",
    customer: { name: "Ana Gutierrez", phone: "(305) 555-0223", email: "ana.g@email.com" },
    bikes: [{ bike_id: 1, make: "Pinarello", model: "Dogma F", color: "Red/Black", serial_number: "PIN456789", services: [12, 4], custom_services: [] }],
    services: ["Wheel Build", "Tire Installation"],
    status: "waiting",
    priority: "high",
    payment_status: "partially_paid",
    payment_method: "credit_card",
    technician: "Alex Torres",
    created: "2026-03-23T09:00:00",
    due: "2026-03-27T17:00:00",
    total: 340,
    tax: 27.20,
    total_paid: 200,
    balance_due: 167.20,
    notes: "Custom wheelset. Waiting on hub delivery.",
    is_pos: false,
    payments: [
      { id: 4, payment_type: "deposit", payment_method: "credit_card", payment_status: "succeeded", total_amount: 20000, stripe_fee: 610, net_amount: 19390, created_at: "2026-03-23T09:15:00" },
    ],
  },
];

export const STATUS_CONFIG: Record<TicketStatus, { label: string; color: "info" | "warning" | "success" | "neutral" | "error" }> = {
  open: { label: "Open", color: "info" },
  in_progress: { label: "In Progress", color: "warning" },
  waiting: { label: "Waiting", color: "neutral" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
};

export const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "text-muted-foreground" },
  medium: { label: "Medium", color: "text-foreground" },
  high: { label: "High", color: "text-amber-600 dark:text-amber-400" },
  urgent: { label: "Urgent", color: "text-red-600 dark:text-red-400" },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: "success" | "warning" | "error" }> = {
  fully_paid: { label: "Paid", color: "success" },
  partially_paid: { label: "Partial", color: "warning" },
  unpaid: { label: "Unpaid", color: "error" },
};
