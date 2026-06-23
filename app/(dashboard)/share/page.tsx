import { Share2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { ShareLinkRow } from "@/components/share-link-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createShareLink } from "@/lib/actions/share";
import { getShareLinks, getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SharePage() {
  const [links, categories] = await Promise.all([
    getShareLinks(),
    getCategories(),
  ]);

  return (
    <div>
      <PageHeader
        title="Share Links"
        description="Create read-only inventory snapshots to share — no login required."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create a share link</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createShareLink} className="grid gap-4 sm:grid-cols-4 sm:items-end">
            <Field label="Title" htmlFor="title" className="sm:col-span-2">
              <Input id="title" name="title" required placeholder="Storefront stock" />
            </Field>
            <Field label="Scope" htmlFor="scope">
              <Select id="scope" name="scope" defaultValue="FULL_INVENTORY">
                <option value="FULL_INVENTORY">Full inventory</option>
                <option value="LOW_STOCK">Low stock only</option>
                <option value="CATEGORY">Single category</option>
              </Select>
            </Field>
            <Field label="Category (if scoped)" htmlFor="categoryId">
              <Select id="categoryId" name="categoryId" defaultValue="">
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-4">
              <Button type="submit">Create link</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {links.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Share2 className="size-6" />
              </div>
              <p className="font-medium">No share links yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Public path</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((l) => (
                  <ShareLinkRow key={l.id} {...l} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
