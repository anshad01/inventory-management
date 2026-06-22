import { ComingSoon } from "@/components/coming-soon";

export default function PurchaseOrdersPage() {
  return (
    <ComingSoon
      title="Purchase Orders"
      description="Order stock from suppliers and receive it into inventory."
      note="Creating draft POs and receiving them (which records PURCHASE_IN movements) is part of milestone M3 in the spec."
    />
  );
}
