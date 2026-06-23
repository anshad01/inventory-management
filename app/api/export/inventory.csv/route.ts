import { getValuationReport } from "@/lib/queries";

export const dynamic = "force-dynamic";

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/export/inventory.csv — current stock valuation as a CSV download.
export async function GET() {
  const { rows } = await getValuationReport();

  const header = [
    "SKU",
    "Name",
    "QuantityOnHand",
    "CostPrice",
    "SellPrice",
    "CostValue",
    "RetailValue",
  ];
  const lines = [header.join(",")];
  for (const p of rows) {
    lines.push(
      [
        p.sku,
        p.name,
        p.quantityOnHand,
        p.costPrice.toFixed(2),
        p.sellPrice.toFixed(2),
        p.costValue.toFixed(2),
        p.retailValue.toFixed(2),
      ]
        .map(csvCell)
        .join(","),
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="inventory.csv"',
    },
  });
}
