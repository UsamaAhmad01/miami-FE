"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formPost } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

// ─── Dashboard APIs ───

export function usePendingTicketsCount(branch: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["pending-tickets", branch, startDate, endDate],
    queryFn: async () => {
      const { data } = await formPost("/crm/get_pending_bike_tickets_count/",
        { status: "Pending", branch, start_date: startDate, end_date: endDate }
      );
      return data.pending_tickets_count as number;
    },
    enabled: !!branch,
  });
}

export function usePaidTicketsCount(branch: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["paid-tickets", branch, startDate, endDate],
    queryFn: async () => {
      const { data } = await formPost("/crm/get_pending_bike_tickets_count/",
        { status: "Paid", branch, start_date: startDate, end_date: endDate }
      );
      return data.pending_tickets_count as number;
    },
    enabled: !!branch,
  });
}

export function useCompletedTotal(branch: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["completed-total", branch, startDate, endDate],
    queryFn: async () => {
      const { data } = await formPost("/crm/getcompleted_total/",
        { status: "Completed", branch, start_date: startDate, end_date: endDate }
      );
      return data.total_price as number;
    },
    enabled: !!branch,
  });
}

export function useTotalTicketsAmount(branch: string) {
  return useQuery({
    queryKey: ["total-tickets-amount", branch],
    queryFn: async () => {
      const { data } = await formPost("/crm/total_tickets_amount/",
        { branch }
      );
      return data.bike_tickets_count as number;
    },
    enabled: !!branch,
  });
}

export function useRevenueByMonth(yearOne: string, yearTwo: string, branch: string) {
  return useQuery({
    queryKey: ["revenue-by-month", yearOne, yearTwo, branch],
    queryFn: async () => {
      const { data } = await formPost("/crm/get_total_price_by_month_and_year/",
        { year_one: yearOne, year_two: yearTwo, branch }
      );
      return data as {
        total_by_month_year_one: { total_price_month: number }[];
        total_by_month_year_two: { total_price_month: number }[];
      };
    },
    enabled: !!branch,
  });
}

export function useExpectVsActual(startYear: number, endYear: number, branch: string) {
  return useQuery({
    queryKey: ["expect-vs-actual", startYear, endYear, branch],
    queryFn: async () => {
      const { data } = await formPost("/crm/get_total_price_by_status/",
        { start_year: String(startYear), end_year: String(endYear), branch }
      );
      return data as Record<string, { completed_total: number; pending_total: number }>;
    },
    enabled: !!branch,
  });
}

export function useScheduledRepairs(branch: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["scheduled-repairs", branch, startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get(`/crm/tickets/get-scheduled-repairs/${branch}/`, {
        params: { start_date: startDate, end_date: endDate, draw: 1, start: 0, length: 50 },
      });
      return data.data as Array<{
        description: string;
        delivery_date: string;
        mechanic_name: string;
        status: string;
        automatic_generated_invoice_number: string;
      }>;
    },
    enabled: !!branch,
  });
}

export function useSpecialOrders(branch: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["special-orders", branch, startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get(`/crm/tickets/get-special-orders/${branch}/`, {
        params: { start_date: startDate, end_date: endDate, draw: 1, start: 0, length: 50 },
      });
      return data.data as Array<{
        description: string;
        delivery_date: string;
        mechanic_name: string;
        status: string;
        automatic_generated_invoice_number: string;
      }>;
    },
    enabled: !!branch,
  });
}

export function useBranchCalendar(branch: string) {
  return useQuery({
    queryKey: ["branch-calendar", branch],
    queryFn: async () => {
      const { data } = await api.post("/crm/GetBranchData/",
        { branch_name: branch }
      );
      return data.iframe as string;
    },
    enabled: !!branch,
    staleTime: 15 * 60 * 1000, // Calendar iframe rarely changes
  });
}

// ─── Tickets APIs ───

export function useTicketsByBranch(branch: string, params?: { special_order?: string; start?: number; length?: number; search?: string }) {
  return useQuery({
    queryKey: ["tickets-branch", branch, params],
    queryFn: async () => {
      const { data } = await api.get(`/crm/tickets/branch/${branch}/`, {
        params: { draw: 1, start: params?.start || 0, length: params?.length || 50, "search[value]": params?.search || "", special_order: params?.special_order },
      });
      return data as {
        data: Array<Record<string, unknown>>;
        recordsTotal: number;
        recordsFiltered: number;
      };
    },
    enabled: !!branch,
  });
}

export function useTicketByInvoice(invoiceNumber: string) {
  return useQuery({
    queryKey: ["ticket", invoiceNumber],
    queryFn: async () => {
      const { data } = await api.get(`/crm/tickets/${invoiceNumber}/`);
      return data;
    },
    enabled: !!invoiceNumber,
  });
}

export function useTicketByInvoiceNumber(invoiceNumber: string) {
  return useQuery({
    queryKey: ["ticket-by-invoice", invoiceNumber],
    queryFn: async () => {
      const { data } = await api.get("/crm/bike-tickets/by_invoice_number/", {
        params: { automatic_generated_invoice_number: invoiceNumber },
      });
      // API returns an array — unwrap to single object
      return Array.isArray(data) ? data[0] : data;
    },
    enabled: !!invoiceNumber,
  });
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data } = await api.get("/crm/services/");
      return data as Array<{ id: number; name: string; price: number; taxable: boolean; description?: string }>;
    },
    staleTime: 10 * 60 * 1000, // Services rarely change — cache 10 min
  });
}

export function useMechanics() {
  return useQuery({
    queryKey: ["mechanics"],
    queryFn: async () => {
      const { data } = await api.get("/crm/mechanics/");
      // API returns {id, first_name, last_name} — map to {id, name} for convenience
      return (data as Array<{ id: number; first_name?: string; last_name?: string; name?: string }>).map((m) => ({
        id: m.id,
        name: m.name || `${m.first_name || ""} ${m.last_name || ""}`.trim() || `Mechanic ${m.id}`,
      }));
    },
    staleTime: 10 * 60 * 1000, // Mechanics rarely change — cache 10 min
  });
}

export function useInventoryItems(branchId: number) {
  return useQuery({
    queryKey: ["inventory-items", branchId],
    queryFn: async () => {
      const { data } = await api.get(`/inventory/items/${branchId}/`);
      return data as Array<{ id: string; description: string; upc_ean: string; quantity: number; unit_price: number }>;
    },
    enabled: !!branchId,
  });
}

export function usePricing(branchId: number) {
  return useQuery({
    queryKey: ["pricing", branchId],
    queryFn: async () => {
      const { data } = await api.get(`/crm/pricing/${branchId}/`);
      return data as { shipping: number; tax: number; service_charge: number };
    },
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // Pricing config rarely changes
  });
}

export function usePaymentHistory(invoiceNumber: string) {
  return useQuery({
    queryKey: ["payment-history", invoiceNumber],
    queryFn: async () => {
      const { data } = await api.get(`/crm/pos/payment-history/${invoiceNumber}/`);
      return data as {
        success?: boolean;
        ticket?: { total_due: number; amount_paid: number; balance_due: number };
        payments?: Array<{ sequence: number; payment_method: string; amount: number; status: string; initiated_at: string; completed_at: string }>;
      };
    },
    enabled: !!invoiceNumber,
  });
}

// ─── Mutations ───

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/crm/bike-tickets/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000, // 60s timeout
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets-branch"] });
    },
  });
}

export function useUpdateTicket(ticketDbId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.patch(`/crm/bike-tickets/${ticketDbId}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets-branch"] });
      queryClient.invalidateQueries({ queryKey: ["ticket"] });
    },
  });
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketIds, status }: { ticketIds: string | string[]; status: string }) => {
      const ids = Array.isArray(ticketIds) ? ticketIds : [ticketIds];
      const { data } = await api.post("/crm/tickets/bulk-update-status/", { ticket_ids: ids, status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets-branch"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-repairs"] });
      queryClient.invalidateQueries({ queryKey: ["special-orders"] });
    },
  });
}

export function useBulkUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketIds, status }: { ticketIds: string | string[]; status: string }) => {
      const ids = Array.isArray(ticketIds) ? ticketIds : [ticketIds];
      const { data } = await api.post("/crm/tickets/bulk-update-payment-status/", { ticket_ids: ids, status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets-branch"] });
    },
  });
}

export function useBulkDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticketIds: string) => {
      const { data } = await api.post("/crm/tickets/bulk-delete/", { ticket_ids: ticketIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets-branch"] });
    },
  });
}

export function useBulkAddNotes() {
  return useMutation({
    mutationFn: async ({ ticketIds, note }: { ticketIds: string; note: string }) => {
      const { data } = await api.post("/crm/tickets/bulk-add-notes/", { ticket_ids: ticketIds, note });
      return data;
    },
  });
}

export function useBulkEmail() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/crm/tickets/bulk-email/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
  });
}

export function useExportTickets(branch: string) {
  return useMutation({
    mutationFn: async (invoiceNumbers: string[]) => {
      const { data } = await api.post(`/crm/tickets/export/${branch}/`, { invs: invoiceNumbers }, {
        responseType: "blob",
      });
      // Trigger download
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tickets-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceNumber: string) => {
      await api.delete(`/crm/bike-tickets/${invoiceNumber}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets-branch"] });
    },
  });
}

export function useRecordCashPayment() {
  return useMutation({
    mutationFn: async ({ invoiceNumber, amount, paymentMethod }: { invoiceNumber: string; amount: number; paymentMethod: string }) => {
      const { data } = await api.post("/crm/pos/record-cash-payment/", {
        invoice_number: invoiceNumber,
        amount,
        payment_method: paymentMethod,
      });
      return data;
    },
  });
}

// ─── User Profile APIs ───

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const { data } = await api.post("/user/update-customer/", payload);
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["branch-user"] }); },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: { user_id: string; old_password: string; new_password: string; confirm_password: string }) => {
      const { data } = await api.post("/user/update-password/", payload);
      return data;
    },
  });
}

export function useUploadTaxCert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/user/upload-resale-tax-certificate/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tax-certs"] }); },
  });
}

export function useGetTaxCerts(userId: number) {
  return useQuery({
    queryKey: ["tax-certs", userId],
    queryFn: async () => {
      const { data } = await api.get("/user/get-resale-tax-certificate/", { params: { user_id: userId } });
      return data as { tax_files: Array<{ url: string; original_name: string; path: string }> };
    },
    enabled: !!userId,
  });
}

export function useDeleteTaxCert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taxPath, userId }: { taxPath: string; userId: string }) => {
      const { data } = await api.delete("/user/delete-resale-tax-certificate/", { data: { tax_path: taxPath, user_id: userId } });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tax-certs"] }); },
  });
}

// ─── Branch Users API ───

export function useBranchUsers(branchId: number) {
  return useQuery({
    queryKey: ["branch-users", branchId],
    queryFn: async () => {
      const { data } = await api.get("/user/get-all-branch-users/", { params: { branch_id: branchId } });
      return data as Array<{ email: string; first_name: string; last_name: string; rs_tax: string | null }>;
    },
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // Branch users list rarely changes
  });
}

// ─── Customer Tickets API ───

export function useCustomerTickets(
  filter: { email?: string; name?: string },
  branchId: number,
  params?: { special_order?: string }
) {
  return useQuery({
    queryKey: ["customer-tickets", filter, branchId, params],
    queryFn: async () => {
      const option = JSON.stringify(filter);
      const { data } = await api.get("/crm/customers/search", {
        params: {
          option,
          branch: branchId,
          special_order: params?.special_order,
          draw: 1,
          start: 0,
          length: 100,
        },
      });
      // Response is a flat array (not wrapped in { data: [] })
      return (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>;
    },
    enabled: !!branchId && (!!filter.email || !!filter.name),
  });
}

// ─── Customers APIs ───

export function useCustomers(branch: string) {
  return useQuery({
    queryKey: ["customers", branch],
    queryFn: async () => {
      const { data } = await api.get("/crm/customers/", { params: { branch } });
      return data as Array<Record<string, unknown>>;
    },
    enabled: !!branch,
  });
}

// ─── Products / Wholesale APIs ───

export function useProducts(params?: { stock?: string }) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const { data } = await api.get("/wholesale/all-products/", { params });
      return data as Array<Record<string, unknown>>;
    },
  });
}

export function useCategoriesWithSubcategories(userId: number) {
  return useQuery({
    queryKey: ["categories-subcategories", userId],
    queryFn: async () => {
      const { data } = await api.get("/wholesale/categories-with-subcategories/", { params: { user_id: userId } });
      return data as Array<{
        id: number;
        Name: string;
        subcategories: Array<{ id: number; Name: string; num_products: number }>;
      }>;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // Categories rarely change
  });
}

export function useAllProductsPaginated(params: {
  user_id: number;
  draw?: number;
  start?: number;
  length?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["all-products-paginated", params],
    queryFn: async () => {
      const { data } = await api.get("/wholesale/all-products/", {
        params: { user_id: params.user_id, draw: params.draw || 1, start: params.start || 0, length: params.length || 50, "search[value]": params.search || "" },
      });
      return data as { data: Array<Record<string, unknown>>; recordsTotal: number; recordsFiltered: number };
    },
    enabled: !!params.user_id,
  });
}

export function useCategoryProducts(params: {
  user_id: number;
  category_id: number;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  minMargin?: string;
  maxMargin?: string;
  stock?: string;
  draw?: number;
  start?: number;
  length?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["category-products", params],
    queryFn: async () => {
      const { data } = await api.get("/wholesale/category-products/", {
        params: { ...params, "search[value]": params.search || "" },
      });
      return data as { data: Array<Record<string, unknown>>; recordsTotal: number; recordsFiltered: number; category_name?: string };
    },
    enabled: !!params.user_id && !!params.category_id,
  });
}

export function useSubcategoryProducts(params: {
  user_id: number;
  sub_category_id: number;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  minMargin?: string;
  maxMargin?: string;
  stock?: string;
  draw?: number;
  start?: number;
  length?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["subcategory-products", params],
    queryFn: async () => {
      const { data } = await api.get("/wholesale/sub-category-products/", {
        params: { ...params, "search[value]": params.search || "" },
      });
      return data as { data: Array<Record<string, unknown>>; recordsTotal: number; recordsFiltered: number };
    },
    enabled: !!params.user_id && !!params.sub_category_id,
  });
}

export function useDownloadAllProductsCsv() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post("/wholesale/download-product-excel/", { user_id: userId }, { responseType: "blob" });
      downloadBlob(data, "All_Products.csv");
    },
  });
}

export function useDownloadSelectedProductsCsv() {
  return useMutation({
    mutationFn: async ({ skus, userId }: { skus: string[]; userId: string }) => {
      const { data } = await api.post("/wholesale/download-selected-excel/", { skus, user_id: userId }, { responseType: "blob" });
      downloadBlob(data, "selectedproducts.csv");
    },
  });
}

export function useProductDetail(sku: string, userId: number) {
  return useQuery({
    queryKey: ["product-detail", sku, userId],
    queryFn: async () => {
      const { data } = await api.get(`/wholesale/products/${sku}/user/${userId}`);
      return data as Record<string, unknown>;
    },
    enabled: !!sku && !!userId,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { user_id: string; items: Array<{ sku: string; quantity: number; distributorId: string }> }) => {
      const { data } = await api.post("/ecommerce/add_item_to_cart/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
    },
  });
}

export function useAddToWatchlist() {
  return useMutation({
    mutationFn: async (payload: { user_id: string; items: Array<{ sku: string; priceTarget?: number; boolpriceTarget?: boolean; boolcheckstock?: boolean }> }) => {
      const { data } = await api.post("/ecommerce/create_watchlist/", payload);
      return data;
    },
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Orders APIs ───

export function useOrders(userId: number) {
  return useQuery({
    queryKey: ["orders", userId],
    queryFn: async () => {
      const { data } = await api.get("/ecommerce/get_orders/", { params: { user_id: userId } });
      return data as Array<Record<string, unknown>>;
    },
    enabled: !!userId,
  });
}

// ─── Order Detail & Management APIs ───

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: async () => {
      const { data } = await api.post("/ecommerce/order_detail/", { order_id: orderId });
      return data as Record<string, unknown>;
    },
    enabled: !!orderId,
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/ecommerce/update_order/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-detail"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useVendorsByUpc(upc: string) {
  return useQuery({
    queryKey: ["vendors-by-upc", upc],
    queryFn: async () => {
      const { data } = await api.get("/wholesale/get_vendors_by_upc/", { params: { upc } });
      return data as { vendors: Array<{ screen_name: string; quantity: number }> };
    },
    enabled: !!upc,
  });
}

export function useUploadInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/ecommerce/upload-invoice/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-invoices"] });
    },
  });
}

export function useGetInvoices(orderId: string) {
  return useQuery({
    queryKey: ["order-invoices", orderId],
    queryFn: async () => {
      const { data } = await api.get("/ecommerce/get-invoice/", { params: { order_id: orderId } });
      return data as { invoices: Array<{ url: string; original_name: string; path: string }> };
    },
    enabled: !!orderId,
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoicePath, orderId }: { invoicePath: string; orderId: string }) => {
      const { data } = await api.delete("/ecommerce/delete-ref-invoice/", { data: { invoice_path: invoicePath, order_id: orderId } });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-invoices"] });
    },
  });
}

export function useDownloadOrderCsv() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post("/ecommerce/admin_invoice_order", { order_id: orderId }, { responseType: "blob" });
      downloadBlob(data, `order_${orderId}.csv`);
    },
  });
}

export function useDownloadOrderItemsCsv() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post("/ecommerce/admin_order_items", { order_id: orderId }, { responseType: "blob" });
      downloadBlob(data, `Vendor_order_${orderId}.csv`);
    },
  });
}

export function useGenerateOrderPdf() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post("/ecommerce/generate-pdf/", { order_id: orderId }, { responseType: "blob" });
      downloadBlob(data, `order_${orderId}.pdf`);
    },
  });
}

// ─── Bulk Email APIs ───

export function useBulkEmailLists(userId: number) {
  return useQuery({
    queryKey: ["bulk-email-lists", userId],
    queryFn: async () => {
      const { data } = await api.get("/bulk-email/display-list-of/", { params: { user_id: userId } });
      return (data.data || data) as Array<{ id: number; ListName: string; total_customers: number; created_on: string }>;
    },
    enabled: !!userId,
  });
}

export function useUploadBulkEmailList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/bulk-email/upload-list/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bulk-email-lists"] }); },
  });
}

export function useDeleteBulkEmailLists() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idarray, userId }: { idarray: number[]; userId: string }) => {
      const { data } = await api.post("/bulk-email/delete-customer-list/", { idarray, user_id: userId });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bulk-email-lists"] }); },
  });
}

export function useSendBulkEmailToLists() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/bulk-email/handle-bulk-email-submission/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      return data;
    },
  });
}

export function useBulkEmailCustomers(listId: number) {
  return useQuery({
    queryKey: ["bulk-email-customers", listId],
    queryFn: async () => {
      const { data } = await api.get("/bulk-email/display-customers/", { params: { list_id: listId } });
      return data as { data: Array<{ id: number; FirstName: string; LastName: string; CompanyName: string; Email: string }>; list_name?: string };
    },
    enabled: !!listId,
  });
}

export function useAddBulkEmailEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/bulk-email/add-entry-list/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bulk-email-customers"] }); },
  });
}

export function useEditBulkEmailListName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/bulk-email/edit-list-name/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bulk-email-lists"] }); queryClient.invalidateQueries({ queryKey: ["bulk-email-customers"] }); },
  });
}

export function useUploadBulkEmailCsv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/bulk-email/upload-csv/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bulk-email-customers"] }); },
  });
}

export function useDeleteBulkEmailRecords() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idarray, userId }: { idarray: number[]; userId: string }) => {
      const { data } = await api.post("/bulk-email/delete-records/", { idarray, user_id: userId });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bulk-email-customers"] }); },
  });
}

export function useSendEmailToCustomers() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/bulk-email/handle-email-submission/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      return data;
    },
  });
}

// ─── Admin Orders APIs ───

export function useAdminOrders(branchId: number, userId: number) {
  return useQuery({
    queryKey: ["admin-orders", branchId, userId],
    queryFn: async () => {
      const { data } = await api.get(`/ecommerce/admin_get_orders/${branchId}/${userId}/`, { params: { draw: 1, start: 0, length: 50 } });
      return data as { data: Array<Record<string, unknown>>; recordsTotal: number };
    },
    enabled: !!branchId && !!userId,
  });
}

export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => { const { data } = await api.post("/ecommerce/update-order-status/", payload); return data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); },
  });
}

export function useAssignOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => { const { data } = await api.post("/ecommerce/assign_order/", payload); return data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); },
  });
}

export function useDeleteAdminOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => { const { data } = await api.post("/ecommerce/delete_order/", payload); return data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); },
  });
}

export function useUpdateAdminOrderPaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => { const { data } = await api.post("/ecommerce/update_order_payment_status/", payload); return data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); },
  });
}

// ─── Pricing APIs ───

export function useUpdatePricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ branchId, tax, service_charge }: { branchId: number; tax: number; service_charge: number }) => {
      const { data } = await api.patch(`/crm/pricing/${branchId}/`, { tax, service_charge });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pricing"] }); },
  });
}

// ─── 3P Document APIs ───

export function useList3pDocuments() {
  return useQuery({
    queryKey: ["3p-documents"],
    queryFn: async () => { const { data } = await api.get("/ecommerce/list-3p-documents/"); return data as Array<{ name: string; size: number; url: string }>; },
  });
}

export function useUpload3pDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => { const { data } = await api.post("/ecommerce/upload-3p-document/", formData, { headers: { "Content-Type": "multipart/form-data" } }); return data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["3p-documents"] }); },
  });
}

export function useAdd3pDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => { const { data } = await api.post("/ecommerce/add-3p-document/", formData, { headers: { "Content-Type": "multipart/form-data" } }); return data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["3p-documents"] }); },
  });
}

export function useDelete3pDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => { const { data } = await api.post("/ecommerce/delete-3p-document/", payload); return data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["3p-documents"] }); },
  });
}

export function useSubmitSupportTicket() {
  return useMutation({
    mutationFn: async (formData: FormData) => { const { data } = await api.post("/ecommerce/support-ticket/", formData, { headers: { "Content-Type": "multipart/form-data" } }); return data; },
  });
}

// ─── Time Tracker APIs ───

export function useSessionStatus(userId: number) {
  return useQuery({
    queryKey: ["session-status", userId],
    queryFn: async () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { data } = await api.get("/user/sessions/action/", { params: { user_id: userId, timezone: tz } });
      return data as { status?: string; elapsed_seconds?: number; session_id?: number };
    },
    enabled: !!userId,
  });
}

export function useSessionAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "start" | "pause" | "resume" | "complete" }) => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { data } = await api.post("/user/sessions/action/", { user_id: userId, action, timezone: tz });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["session-status"] }); queryClient.invalidateQueries({ queryKey: ["sessions"] }); },
  });
}

export function useSessions(userId: number, params?: { status?: string; date_from?: string; date_to?: string }) {
  return useQuery({
    queryKey: ["sessions", userId, params],
    queryFn: async () => {
      const { data } = await api.get("/user/sessions/", { params: { user_id: userId, ...params, draw: 1, start: 0, length: 50 } });
      return data as { data: Array<Record<string, unknown>> };
    },
    enabled: !!userId,
  });
}

// ─── Chat / SMS APIs ───

export function useAllChats(branch: string) {
  return useQuery({
    queryKey: ["all-chats", branch],
    queryFn: async () => { const { data } = await api.get("/api/all_tickets/", { params: { search: branch } }); return data as Array<Record<string, unknown>>; },
    enabled: !!branch,
  });
}

export function useFetchChatRecord(invoiceNumber: string) {
  return useQuery({
    queryKey: ["chat-record", invoiceNumber],
    queryFn: async () => { const { data } = await api.get("/api/FetchRecord/", { params: { search: invoiceNumber } }); return data as Record<string, unknown>; },
    enabled: !!invoiceNumber,
  });
}

export function useShowSms(invoiceNumber: string) {
  return useQuery({
    queryKey: ["show-sms", invoiceNumber],
    queryFn: async () => { const { data } = await api.post("/api/show_sms/", { inv: invoiceNumber }); return data as Array<Record<string, unknown>>; },
    enabled: !!invoiceNumber,
  });
}

export function useSendSms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { to_number: string; body_msg: string; inv: string }) => { const { data } = await api.post("/api/send_sms/", payload); return data; },
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ["show-sms", vars.inv] }); },
  });
}

// ─── Inventory Management APIs ───

export function useInventorySearch(userId: number, branchId: number, params?: { draw?: number; start?: number; length?: number; search?: string }) {
  return useQuery({
    queryKey: ["inventory-search", userId, branchId, params],
    queryFn: async () => {
      const { data } = await api.get(`/inventory/inventory_items/search_inventory/${userId}/${branchId}/`, {
        params: { draw: params?.draw || 1, start: params?.start || 0, length: params?.length || 10, "search[value]": params?.search || "" },
      });
      return data as {
        data: Array<{ id: number; part_number: string; upc_ean: string; description: string; quantity: number; unit_price: number; branch: number }>;
        recordsTotal: number;
        recordsFiltered: number;
        accessible_branches: Array<{ id: number; name: string }>;
      };
    },
    enabled: !!userId && !!branchId,
  });
}

export function useAddInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ branchId, ...payload }: { branchId: number; part_number: string; description: string; quantity: number; unit_price: number; upc_ean: string; branch: string }) => {
      const { data } = await api.post(`/inventory/items/${branchId}/`, payload);
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory-search"] }); },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ branchId, itemId, ...payload }: { branchId: number; itemId: number; quantity?: number; unit_price?: number; branch?: number; remarks?: string }) => {
      const { data } = await api.patch(`/inventory/items/${branchId}/${itemId}/`, payload);
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory-search"] }); },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ branchId, itemId }: { branchId: number; itemId: number }) => {
      await api.delete(`/inventory/items/${branchId}/${itemId}/`);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory-search"] }); },
  });
}

export function useBulkDeleteInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productIds: string) => {
      const { data } = await api.post("/inventory/bulk-delete/", { product_ids: productIds });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory-search"] }); },
  });
}

export function useProductByUpc(upc: string) {
  return useQuery({
    queryKey: ["product-by-upc", upc],
    queryFn: async () => {
      const { data } = await api.get(`/inventory/product-by-upc/${upc}`);
      return data as { description?: string };
    },
    enabled: !!upc && upc.length > 3,
  });
}

export function useTransferHistory(partNumber: string) {
  return useQuery({
    queryKey: ["transfer-history", partNumber],
    queryFn: async () => {
      const { data } = await api.get(`/inventory/history/${partNumber}/`);
      return data as Array<{ part_number: string; quantity_transferred: number; source_location: string; destination_location: string; transferred_date: string }>;
    },
    enabled: !!partNumber,
  });
}

// ─── POS & Sales APIs ───

export function useInventoryByUpc(upc: string, branchId: number, userId: number) {
  return useQuery({
    queryKey: ["inventory-by-upc", upc, branchId, userId],
    queryFn: async () => {
      const { data } = await api.get(`/inventory/inventory-by-upc/${upc}/${branchId}/${userId}/`);
      return data as Array<{ id: number; description: string; unit_price: number; upc_ean: string; quantity: number }>;
    },
    enabled: !!upc && !!branchId && !!userId,
  });
}

export function useCreatePosTicket() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/crm/bike-tickets/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      return data as { automatic_generated_invoice_number?: string };
    },
  });
}

export function useSalesData(userId: number, branchId: number) {
  return useQuery({
    queryKey: ["sales", userId, branchId],
    queryFn: async () => {
      const { data } = await api.get("/crm/sales/", { params: { user_id: userId, branch: branchId, status: "Completed" } });
      return data as { data: { tickets: Array<Record<string, unknown>> } };
    },
    enabled: !!userId && !!branchId,
  });
}

// ─── POS Payment APIs ───

export function useProcessPosPayment() {
  return useMutation({
    mutationFn: async (payload: {
      invoice_number: string;
      terminal_id?: string;
      amount?: number;
      payment_method?: string;
      branch_id?: string;
      user_id: string;
      custom_amount?: number;
      payment_type?: string;
      enable_tipping?: boolean;
      receipt_email?: string;
    }) => {
      const { data } = await api.post("/crm/pos/process-payment/", payload);
      return data as { success: boolean; payment_intent_id?: string };
    },
  });
}

// ─── POS Invoice APIs ───

export function usePosInvoice(invoiceNumber: string) {
  return useQuery({
    queryKey: ["pos-invoice", invoiceNumber],
    queryFn: async () => {
      const { data } = await api.get(`/crm/pos/${invoiceNumber}/`);
      return data as Record<string, unknown>;
    },
    enabled: !!invoiceNumber,
  });
}

export function usePollPosPaymentStatus(invoiceNumber: string, enabled: boolean) {
  return useQuery({
    queryKey: ["pos-payment-status-poll", invoiceNumber],
    queryFn: async () => {
      const { data } = await api.get(`/crm/payment/status/${invoiceNumber}/`);
      return data as {
        success: boolean;
        payment_status: "succeeded" | "failed" | "canceled";
        total_amount?: number;
        card_details?: { brand: string; last_four: string };
        failure_message?: string;
      };
    },
    refetchInterval: enabled ? 2000 : false,
    enabled: enabled && !!invoiceNumber,
    staleTime: 0,
    gcTime: 0,
  });
}

// ─── Invoice / Payment APIs ───

export function useCheckTerminal() {
  return useMutation({
    mutationFn: async ({ invoiceNumber, userId }: { invoiceNumber: string; userId: string }) => {
      const { data } = await api.post("/crm/pos/check-terminal/", {
        invoice_number: invoiceNumber,
        user_id: userId,
      });
      return data as {
        success: boolean;
        can_process: boolean;
        terminals: Array<{ terminal_id: string; label: string; device_type: string; status: string }>;
      };
    },
  });
}

export function usePollPaymentStatus(invoiceNumber: string, enabled: boolean) {
  return useQuery({
    queryKey: ["payment-status-poll", invoiceNumber],
    queryFn: async () => {
      const { data } = await api.get(`/bike_ticket/payment/status/${invoiceNumber}/`);
      return data as { payment_status: "succeeded" | "failed" | "canceled" };
    },
    refetchInterval: enabled ? 2000 : false,
    enabled: enabled && !!invoiceNumber,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCancelPayment() {
  return useMutation({
    mutationFn: async (invoiceNumber: string) => {
      const { data } = await api.post("/crm/pos/cancel-payment/", { invoice_number: invoiceNumber });
      return data;
    },
  });
}

export function useSendPdfEmail() {
  return useMutation({
    mutationFn: async ({ file, receiver, invoiceNumber }: { file: string; receiver: string; invoiceNumber: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("reciever", receiver);
      formData.append("inv_num", invoiceNumber);
      const { data } = await api.post("/crm/send_pdf_email/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
  });
}

export function useBranchData(branchName: string) {
  return useQuery({
    queryKey: ["branch-data", branchName],
    queryFn: async () => {
      const { data } = await api.post("/crm/GetBranchData/", { branch_name: branchName });
      return data as Record<string, string>;
    },
    enabled: !!branchName,
    staleTime: 15 * 60 * 1000, // Branch info rarely changes
  });
}

// ─── Stripe APIs ───

export function useValidateStripe() {
  return useMutation({
    mutationFn: async ({ userId, branchId }: { userId: string; branchId: string }) => {
      const { data } = await api.post("/stripe/validate-stripe-account/", {
        user_id: userId,
        branch_id: branchId,
      });
      return data;
    },
  });
}

export function useEnableTerminalPayment() {
  return useMutation({
    mutationFn: async (invoiceNumber: string) => {
      const { data } = await api.post("/crm/pos/enable-terminal-payment/", {
        invoice_number: invoiceNumber,
      });
      return data;
    },
  });
}

// ─── Cart & Checkout APIs ───

export function useViewCart(userId: number) {
  return useQuery({
    queryKey: ["view-cart", userId],
    queryFn: async () => {
      const { data } = await api.get("/ecommerce/view_cart/", { params: { user_id: userId } });
      return data as { cart_items: Array<Record<string, unknown>>; total_cart_price?: number; grand_total_item_price?: number; "mb-service_charge"?: number; "mb-service_charge_amount"?: number };
    },
    enabled: !!userId,
  });
}

export function useDeleteCartItemPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ vendorProductId, userId }: { vendorProductId: string; userId: string }) => {
      const { data } = await api.post(`/ecommerce/remove_from_cart/${vendorProductId}/`, { user_id: userId });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["view-cart"] }); queryClient.invalidateQueries({ queryKey: ["cart-items"] }); },
  });
}

export function useUpdateCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { user_id: string; items: Array<{ sku: string; quantity: number }> }) => {
      const { data } = await api.post("/ecommerce/update_cart/", payload);
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["view-cart"] }); queryClient.invalidateQueries({ queryKey: ["cart-items"] }); },
  });
}

export function useEmptyCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post("/ecommerce/empty_cart/", { user_id: userId });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["view-cart"] }); queryClient.invalidateQueries({ queryKey: ["cart-items"] }); },
  });
}

export function useImportCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/ecommerce/import-cart/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["view-cart"] }); queryClient.invalidateQueries({ queryKey: ["cart-items"] }); },
  });
}

export function useQuickImportCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post("/ecommerce/quick-import-cart/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["view-cart"] }); queryClient.invalidateQueries({ queryKey: ["cart-items"] }); },
  });
}

export function useViewBranchUser(userId: number) {
  return useQuery({
    queryKey: ["branch-user", userId],
    queryFn: async () => {
      const { data } = await api.post("/user/view-branch-user/", { user_id: String(userId) });
      return data as Record<string, unknown>;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // User profile — cache 5 min
  });
}

export function useSaveBranchUser() {
  return useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const { data } = await api.post("/user/create-branch-user/", payload);
      return data;
    },
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const { data } = await api.post("/ecommerce/place_order/", payload);
      return data as { order_id?: string };
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["orders"] }); },
  });
}

// ─── Cart APIs (header mini cart) ───

export function useCartItems(userId: number) {
  return useQuery({
    queryKey: ["cart-items", userId],
    queryFn: async () => {
      const { data } = await api.post("/ecommerce/view_cart_items/", { user_id: String(userId) });
      return data as {
        cart_items: Array<{
          vendor_product_id: string;
          upc: string;
          title: string;
          images: string[];
          vendor: string;
          quantity: number;
          base_price: number;
        }>;
        total_cart_price: number;
        grand_total_item_price: number;
      };
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // Cart changes often — 30s cache
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vendorProductId: string) => {
      // deleteItemCart from warehouse_main.js equivalent
      const { data } = await api.delete(`/ecommerce/remove_from_cart/${vendorProductId}/`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
    },
  });
}
