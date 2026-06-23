import { AppShell } from "@/components/app-shell";
import { requireStaff } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();
  return <AppShell user={user}>{children}</AppShell>;
}
