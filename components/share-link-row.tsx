"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Ban, Loader2, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { revokeShareLink } from "@/lib/actions/share";

const SCOPE_LABELS: Record<string, string> = {
  FULL_INVENTORY: "Full inventory",
  LOW_STOCK: "Low stock",
  CATEGORY: "Category",
};

export function ShareLinkRow({
  id,
  token,
  title,
  scope,
  isActive,
}: {
  id: string;
  token: string;
  title: string;
  scope: string;
  isActive: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const path = `/s/${token}`;

  function copy() {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{title}</TableCell>
      <TableCell className="text-muted-foreground">
        {SCOPE_LABELS[scope] ?? scope}
      </TableCell>
      <TableCell>
        {isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="secondary">Revoked</Badge>
        )}
      </TableCell>
      <TableCell>
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{path}</code>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          {isActive && (
            <>
              <Button variant="ghost" size="icon" onClick={copy} aria-label="Copy link">
                {copied ? <Check className="text-success" /> : <Copy />}
              </Button>
              <Button asChild variant="ghost" size="icon" aria-label="Open snapshot">
                <a href={path} target="_blank" rel="noreferrer">
                  <ExternalLink />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={pending}
                aria-label="Revoke"
                onClick={() =>
                  startTransition(async () => {
                    await revokeShareLink(id);
                  })
                }
              >
                {pending ? <Loader2 className="animate-spin" /> : <Ban className="text-destructive" />}
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
