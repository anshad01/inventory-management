import { PageHeader } from "@/components/page-header";
import { StockBadge } from "@/components/stock-badge";
import { AddToCart } from "@/components/add-to-cart";
import { ProductImage } from "@/components/product-image";
import { ShopFilters } from "@/components/shop-filters";
import { Pagination } from "@/components/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { getShopProducts, getCategories } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  page?: string;
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [{ rows, total, pageCount }, categories] = await Promise.all([
    getShopProducts({
      q: sp.q,
      category: sp.category,
      minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
      maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
      inStock: sp.inStock === "1",
      page,
    }),
    getCategories(),
  ]);

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.category) params.set("category", sp.category);
    if (sp.minPrice) params.set("minPrice", sp.minPrice);
    if (sp.maxPrice) params.set("maxPrice", sp.maxPrice);
    if (sp.inStock) params.set("inStock", sp.inStock);
    params.set("page", String(p));
    return `/shop?${params.toString()}`;
  };

  return (
    <div>
      <PageHeader
        title="Shop"
        description="Browse our computer peripherals and check live availability."
      />

      <ShopFilters
        categories={categories}
        values={{
          q: sp.q,
          category: sp.category,
          minPrice: sp.minPrice,
          maxPrice: sp.maxPrice,
          inStock: sp.inStock === "1",
        }}
      />

      {rows.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-16 text-center text-sm text-muted-foreground">
            No products match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => {
            const outOfStock = p.quantityOnHand <= 0;
            return (
              <Card key={p.id} className="flex flex-col overflow-hidden">
                <ProductImage src={p.imageUrl} alt={p.name} className="aspect-video w-full" />
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
      )}

      <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {total} product{total === 1 ? "" : "s"} found
      </p>
    </div>
  );
}
