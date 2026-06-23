import { redirect } from "next/navigation";
import { Boxes } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Already signed in → go to the app.
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Boxes className="size-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your stock.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Demo accounts (password <code>password123</code>):<br />
              <strong>priya@inventory.example</strong> — Admin ·{" "}
              <strong>sam@inventory.example</strong> — Staff
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
