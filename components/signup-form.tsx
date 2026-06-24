"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { signupAction } from "@/lib/actions/auth";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, null);
  const [accountType, setAccountType] = useState<"CUSTOMER" | "SUPPLIER">("CUSTOMER");

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="accountType" value={accountType} />

      <Field label="I want to" htmlFor="accountType">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "CUSTOMER", label: "Shop as a customer" },
              { value: "SUPPLIER", label: "Sell as a supplier" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAccountType(opt.value)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                accountType === opt.value
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-input text-muted-foreground hover:bg-accent",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Your name" htmlFor="name">
        <Input id="name" name="name" required placeholder="Jordan Smith" />
      </Field>

      {accountType === "SUPPLIER" ? (
        <Field label="Business name" htmlFor="businessName">
          <Input id="businessName" name="businessName" required placeholder="Acme Supplies" />
        </Field>
      ) : null}

      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 6 characters">
        <Input id="password" name="password" type="password" required minLength={6} />
      </Field>

      {accountType === "SUPPLIER" ? (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Supplier accounts need admin approval before you can list products.
        </p>
      ) : null}

      {state?.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="animate-spin" /> : null} Create account
      </Button>
    </form>
  );
}
