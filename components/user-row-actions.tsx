"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import {
  setStaffRole,
  setSupplierApproval,
  setUserActive,
} from "@/lib/actions/admin";
import type { UserRow } from "@/lib/queries";

export function UserRowActions({ user }: { user: UserRow }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Failed.");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center justify-end gap-2">
        {user.type === "STAFF" ? (
          <Select
            className="h-8 w-28 text-xs"
            value={user.role}
            disabled={pending}
            onChange={(e) =>
              run(() => setStaffRole(user.id, e.target.value as "ADMIN" | "STAFF" | "VIEWER"))
            }
          >
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="VIEWER">Viewer</option>
          </Select>
        ) : null}

        {user.type === "SUPPLIER" ? (
          <Button
            size="sm"
            variant={user.isApproved ? "outline" : "default"}
            disabled={pending}
            onClick={() => run(() => setSupplierApproval(user.id, !user.isApproved))}
          >
            {pending ? <Loader2 className="animate-spin" /> : null}
            {user.isApproved ? "Revoke approval" : "Approve"}
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => setUserActive(user.id, !user.isActive))}
        >
          {user.isActive ? "Deactivate" : "Activate"}
        </Button>
      </div>
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
