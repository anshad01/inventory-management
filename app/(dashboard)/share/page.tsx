import { ComingSoon } from "@/components/coming-soon";

export default function SharePage() {
  return (
    <ComingSoon
      title="Share Links"
      description="Create read-only inventory snapshots to share."
      note="Generates public /s/:token snapshot links (full inventory, low stock, or by category). This is milestone M4 in the spec."
    />
  );
}
