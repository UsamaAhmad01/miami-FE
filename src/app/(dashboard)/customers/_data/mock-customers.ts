export interface CustomerTicket {
  id: string;
  invoice_number: string;
  status: "open" | "in_progress" | "waiting" | "completed" | "cancelled";
  services: string[];
  total: number;
  created: string;
  bike: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  total_tickets: number;
  total_spent: number;
  last_visit: string | null;
  tags: string[];
  tickets: CustomerTicket[];
  notes: string;
}

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: "James Rodriguez",
    phone: "(305) 555-0142",
    email: "james.r@email.com",
    address: "1234 Ocean Dr, Miami Beach, FL 33139",
    created_at: "2025-06-15T10:00:00",
    total_tickets: 8,
    total_spent: 1245,
    last_visit: "2026-03-24T09:30:00",
    tags: ["VIP", "Repeat"],
    tickets: [
      { id: "TKT-1042", invoice_number: "100042", status: "in_progress", services: ["Full Tune-Up", "Brake Bleed"], total: 185, created: "2026-03-24T09:30:00", bike: "Trek Domane SL 5" },
      { id: "TKT-1028", invoice_number: "100028", status: "completed", services: ["Chain Replacement"], total: 35, created: "2026-02-10T14:00:00", bike: "Trek Domane SL 5" },
      { id: "TKT-1015", invoice_number: "100015", status: "completed", services: ["Full Tune-Up"], total: 95, created: "2025-12-20T11:00:00", bike: "Trek Domane SL 5" },
    ],
    notes: "Prefers morning drop-offs. Has a race schedule — prioritize when mentioned.",
  },
  {
    id: 2,
    name: "Sarah Chen",
    phone: "(305) 555-0198",
    email: "sarah.c@email.com",
    address: "567 Brickell Ave, Miami, FL 33131",
    created_at: "2025-09-22T08:00:00",
    total_tickets: 4,
    total_spent: 520,
    last_visit: "2026-03-24T08:15:00",
    tags: ["Repeat"],
    tickets: [
      { id: "TKT-1041", invoice_number: "100041", status: "waiting", services: ["Brake Replacement"], total: 120, created: "2026-03-24T08:15:00", bike: "Specialized Tarmac SL7" },
      { id: "TKT-1020", invoice_number: "100020", status: "completed", services: ["Tire Change"], total: 25, created: "2026-01-15T10:00:00", bike: "Specialized Tarmac SL7" },
    ],
    notes: "",
  },
  {
    id: 3,
    name: "Mike Thompson",
    phone: "(305) 555-0167",
    email: "mike.t@email.com",
    address: "890 Coconut Grove, Miami, FL 33133",
    created_at: "2025-04-10T14:00:00",
    total_tickets: 12,
    total_spent: 2340,
    last_visit: "2026-03-23T14:00:00",
    tags: ["VIP", "Repeat", "Fleet"],
    tickets: [
      { id: "TKT-1040", invoice_number: "100040", status: "completed", services: ["Tire Change", "Wheel Alignment"], total: 95, created: "2026-03-23T14:00:00", bike: "Giant Defy Advanced 2" },
    ],
    notes: "Owns 3 bikes. Fleet account — bundle pricing discussed.",
  },
  {
    id: 4,
    name: "Emma Davis",
    phone: "(305) 555-0211",
    email: "emma.d@email.com",
    address: "321 Coral Way, Miami, FL 33145",
    created_at: "2025-11-01T09:00:00",
    total_tickets: 3,
    total_spent: 380,
    last_visit: "2026-03-23T11:00:00",
    tags: [],
    tickets: [
      { id: "TKT-1039", invoice_number: "100039", status: "in_progress", services: ["Chain & Gear Service", "Cable Replacement"], total: 150, created: "2026-03-23T11:00:00", bike: "Cannondale SuperSix EVO" },
    ],
    notes: "",
  },
  {
    id: 5,
    name: "Carlos Mendez",
    phone: "(305) 555-0134",
    email: "carlos.m@email.com",
    address: "456 Little Havana, Miami, FL 33135",
    created_at: "2025-07-20T16:00:00",
    total_tickets: 6,
    total_spent: 890,
    last_visit: "2026-03-22T16:00:00",
    tags: ["Repeat"],
    tickets: [
      { id: "TKT-1038", invoice_number: "100038", status: "completed", services: ["Wheel Truing"], total: 65, created: "2026-03-22T16:00:00", bike: "Bianchi Oltre XR4" },
    ],
    notes: "Speaks Spanish. Celeste Bianchi collector.",
  },
  {
    id: 6,
    name: "Lisa Park",
    phone: "(305) 555-0189",
    email: "lisa.p@email.com",
    address: "789 Wynwood, Miami, FL 33127",
    created_at: "2026-01-05T10:00:00",
    total_tickets: 2,
    total_spent: 310,
    last_visit: "2026-03-24T10:45:00",
    tags: ["Racer"],
    tickets: [
      { id: "TKT-1037", invoice_number: "100037", status: "open", services: ["Full Tune-Up", "Headset Service"], total: 210, created: "2026-03-24T10:45:00", bike: "Scott Addict RC 15" },
    ],
    notes: "Competitive racer. Always needs rush service before events.",
  },
  {
    id: 7,
    name: "David Kim",
    phone: "(305) 555-0156",
    email: "david.k@email.com",
    address: "234 Design District, Miami, FL 33137",
    created_at: "2025-08-12T07:30:00",
    total_tickets: 5,
    total_spent: 1120,
    last_visit: "2026-03-24T07:30:00",
    tags: ["VIP", "Fleet"],
    tickets: [
      { id: "TKT-1036", invoice_number: "100036", status: "open", services: ["Bottom Bracket Service", "Tire Change"], total: 165, created: "2026-03-24T07:30:00", bike: "Cervélo R5 + S5" },
    ],
    notes: "Owns Cervélo R5 and S5. Always brings both.",
  },
  {
    id: 8,
    name: "Ana Gutierrez",
    phone: "(305) 555-0223",
    email: "ana.g@email.com",
    address: "678 South Beach, Miami Beach, FL 33139",
    created_at: "2025-10-18T09:00:00",
    total_tickets: 3,
    total_spent: 640,
    last_visit: "2026-03-23T09:00:00",
    tags: ["Repeat"],
    tickets: [
      { id: "TKT-1035", invoice_number: "100035", status: "waiting", services: ["Wheel Build", "Tire Installation"], total: 340, created: "2026-03-23T09:00:00", bike: "Pinarello Dogma F" },
    ],
    notes: "Custom wheelset project ongoing.",
  },
  {
    id: 9,
    name: "Tom Bradley",
    phone: "(305) 555-0178",
    email: "tom.b@email.com",
    address: "111 Midtown, Miami, FL 33137",
    created_at: "2025-05-25T13:00:00",
    total_tickets: 7,
    total_spent: 950,
    last_visit: "2026-03-22T13:00:00",
    tags: ["Repeat"],
    tickets: [],
    notes: "Di2 enthusiast. Interested in electronic groupset upgrades.",
  },
  {
    id: 10,
    name: "Rachel Foster",
    phone: "(305) 555-0245",
    email: "rachel.f@email.com",
    address: "999 Edgewater, Miami, FL 33132",
    created_at: "2026-02-14T15:00:00",
    total_tickets: 1,
    total_spent: 0,
    last_visit: "2026-03-21T15:00:00",
    tags: ["New"],
    tickets: [],
    notes: "First-time customer. Cancelled initial ticket — may need follow-up.",
  },
];

export const TAG_COLORS: Record<string, string> = {
  VIP: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Repeat: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Fleet: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  Racer: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  New: "bg-muted text-muted-foreground",
};
