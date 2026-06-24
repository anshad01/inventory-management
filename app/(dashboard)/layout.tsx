import { AppShell } from "@/components/app-shell";
import { requireStaff } from "@/lib/auth/session";
import { getNotifications } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();
  const { items, unread } = await getNotifications(user.id);
  return (
    <AppShell user={user} notifications={items} unread={unread}>
      {children}
    </AppShell>
  );
}
