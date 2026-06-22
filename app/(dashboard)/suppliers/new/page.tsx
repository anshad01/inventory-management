import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { createSupplier } from "@/lib/actions";

export default function NewSupplierPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/suppliers">
          <ArrowLeft /> Back to suppliers
        </Link>
      </Button>

      <PageHeader title="Add supplier" description="Add a vendor to your directory." />

      <Card>
        <CardContent className="p-6">
          <form action={createSupplier} className="grid gap-5">
            <Field label="Name" htmlFor="name">
              <Input id="name" name="name" required placeholder="TechSource Distribution" />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" placeholder="orders@techsource.example" />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input id="phone" name="phone" placeholder="+1 555 0100" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button asChild variant="outline" type="button">
                <Link href="/suppliers">Cancel</Link>
              </Button>
              <Button type="submit">Create supplier</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
