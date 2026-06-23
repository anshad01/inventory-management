"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { PickerProduct } from "@/lib/queries";

type Row = { key: number; productId: string; quantity: number; price: number };

/**
 * Editable line-item table shared by Purchase Order and Sale forms. Serializes
 * rows into a hidden `items` field as JSON: { productId, quantity, <priceField> }.
 */
export function LineItemsEditor({
  products,
  priceField,
  defaultPrice,
}: {
  products: PickerProduct[];
  priceField: "unitCost" | "unitPrice";
  defaultPrice: "costPrice" | "sellPrice";
}) {
  const [rows, setRows] = useState<Row[]>([
    { key: 1, productId: "", quantity: 1, price: 0 },
  ]);

  function update(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function onProduct(key: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    update(key, { productId, price: p ? p[defaultPrice] : 0 });
  }
  function addRow() {
    setRows((rs) => [
      ...rs,
      { key: Math.max(0, ...rs.map((r) => r.key)) + 1, productId: "", quantity: 1, price: 0 },
    ]);
  }
  function removeRow(key: number) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));
  }

  const total = rows.reduce((s, r) => s + r.quantity * r.price, 0);
  const serialized = JSON.stringify(
    rows
      .filter((r) => r.productId && r.quantity > 0)
      .map((r) => ({ productId: r.productId, quantity: r.quantity, [priceField]: r.price })),
  );

  return (
    <div>
      <input type="hidden" name="items" value={serialized} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="w-24 text-right">Qty</TableHead>
            <TableHead className="w-32 text-right">
              {priceField === "unitCost" ? "Unit cost" : "Unit price"}
            </TableHead>
            <TableHead className="w-28 text-right">Total</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.key}>
              <TableCell>
                <Select
                  value={r.productId}
                  onChange={(e) => onProduct(r.key, e.target.value)}
                >
                  <option value="">— Select product —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={1}
                  value={r.quantity}
                  onChange={(e) => update(r.key, { quantity: parseInt(e.target.value, 10) || 0 })}
                  className="text-right"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={r.price}
                  onChange={(e) => update(r.key, { price: parseFloat(e.target.value) || 0 })}
                  className="text-right"
                />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(r.quantity * r.price)}
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(r.key)}
                  aria-label="Remove line"
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-3 flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus /> Add line
        </Button>
        <div className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
