import { getOrdersForExport } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/export/orders.csv — all orders with totals as a CSV download.
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.type !== "STAFF" || user.role === "VIEWER") {
    return new Response("Forbidden", { status: 403 });
  }

  const rows = await getOrdersForExport();
  const header = ["SaleNumber", "Customer", "Status", "Items", "Total", "SoldAt"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [r.saleNumber, r.customer, r.status, r.items, r.total.toFixed(2), r.soldAt]
        .map(csvCell)
        .join(","),
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orders.csv"',
    },
  });
}
