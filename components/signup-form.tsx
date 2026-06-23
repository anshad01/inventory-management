"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { signupAction } from "@/lib/actions/auth";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, null);

  return (
    <form action={action} className="grid gap-4">
      <Field label="Name" htmlFor="name">
        <Input id="name" name="name" required placeholder="Jordan Smith" />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 6 characters">
        <Input id="password" name="password" type="password" required minLength={6} />
      </Field>
      {state?.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="animate-spin" /> : null} Create account
      </Button>
    </form>
  );
}
