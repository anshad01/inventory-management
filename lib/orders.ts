// Customer order state machine (SPEC §5). Pure definitions shared by the
// server actions (which enforce transitions) and the UI (which renders the
// available next steps). No "use server" — safe to import anywhere.

export type SaleStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

// Allowed forward transitions. Anything not listed here is rejected.
export const ORDER_TRANSITIONS: Record<SaleStatus, SaleStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: SaleStatus, to: SaleStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

// Cancelling restores stock, but only while the goods haven't shipped — once
// SHIPPED/DELIVERED the stock has physically left and is not returned here.
export function cancelRestoresStock(from: SaleStatus): boolean {
  return from === "PENDING" || from === "CONFIRMED";
}

export const ORDER_STATUS_LABELS: Record<SaleStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
