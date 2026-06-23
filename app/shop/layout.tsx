import { CartProvider } from "@/components/cart-context";
import { ShopHeader } from "@/components/shop-header";
import { requireCustomer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCustomer();

  return (
    <CartProvider>
      <div className="min-h-svh bg-muted/20">
        <ShopHeader name={user.name} />
        <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
      </div>
    </CartProvider>
  );
}
