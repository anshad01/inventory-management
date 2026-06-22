import { ComingSoon } from "@/components/coming-soon";

export default function SalesPage() {
  return (
    <ComingSoon
      title="Sales"
      description="Record sales that draw down stock."
      note="Completing a sale records SALE_OUT movements; voiding reverses them. This is milestone M3 in the spec."
    />
  );
}
