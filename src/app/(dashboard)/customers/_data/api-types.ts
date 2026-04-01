// Types matching the real API response from GET /crm/customers/

export interface ApiCustomer {
  email: string;
  name: string;
  most_recent_ticket_name: string;
  most_recent_phone_number: string;
  most_recent_phone_number2: string;
  total_tickets: number;
  most_recent_ticket: string; // ISO date string
}
