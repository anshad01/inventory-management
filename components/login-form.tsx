"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="grid gap-4">
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required defaultValue="priya@inventory.example" />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" required defaultValue="password123" />
      </Field>
      {state?.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="animate-spin" /> : null} Sign in
      </Button>
    </form>
  );
}
