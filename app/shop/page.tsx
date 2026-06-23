import { PageHeader } from "@/components/page-header";
import { StockBadge } from "@/components/stock-badge";
import { AddToCart } from "@/components/add-to-cart";
import { Card, CardContent } from "@/components/ui/card";
import { getShopProducts } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getShopProducts();

  return (
    <div>
      <PageHeader
        title="Shop"
        description="Browse our computer peripherals and check live availability."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const outOfStock = p.quantityOnHand <= 0;
          return (
            <Card key={p.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium leading-tight">{p.name}</h3>
                    <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <StockBadge product={p} />
                </div>
                {p.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-lg font-semibold tabular-nums">
                    {formatCurrency(p.sellPrice)}
                  </span>
                </div>
                <AddToCart
                  product={{ id: p.id, name: p.name, sku: p.sku, price: p.sellPrice }}
                  disabled={outOfStock}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
