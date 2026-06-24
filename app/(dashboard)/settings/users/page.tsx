import { PageHeader } from "@/components/page-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRowActions } from "@/components/user-row-actions";
import { getUsers } from "@/lib/queries";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  STAFF: "Staff",
  SUPPLIER: "Supplier",
  CUSTOMER: "Customer",
};

export default async function UsersPage() {
  await requireAdmin();
  const users = await getUsers();
  const pendingSuppliers = users.filter(
    (u) => u.type === "SUPPLIER" && !u.isApproved,
  ).length;

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage accounts, staff roles, and supplier approvals."
      />

      {pendingSuppliers > 0 ? (
        <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          {pendingSuppliers} supplier{pendingSuppliers > 1 ? "s are" : " is"} awaiting
          approval.
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span>{TYPE_LABELS[u.type] ?? u.type}</span>
                      {u.supplierName ? (
                        <span className="text-xs text-muted-foreground">{u.supplierName}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {u.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                      {u.type === "SUPPLIER" ? (
                        u.isApproved ? (
                          <Badge variant="secondary">Approved</Badge>
                        ) : (
                          <DocStatusBadge status="PENDING" />
                        )
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <UserRowActions user={u} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
