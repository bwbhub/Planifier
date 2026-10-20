"use client";

import { Button } from "@planifier/ui/components/button";

import { ROUTES } from "@/lib/routes";

import { AuthErrorAlert } from "../atoms/auth-error-alert";
import { useSignOut } from "../queries/auth.queries";
import { useSessionRedirect } from "../utils/use-session-redirect";

export function SignOutButton() {
  const redirectTo = useSessionRedirect();
  const signOut = useSignOut();

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant="secondary"
        disabled={signOut.isPending}
        onClick={() => {
          signOut.mutate(undefined, {
            onSuccess: () => {
              redirectTo(ROUTES.signIn);
            },
          });
        }}
      >
        {signOut.isPending ? "Déconnexion…" : "Se déconnecter"}
      </Button>
      {signOut.isError ? <AuthErrorAlert error={signOut.error} /> : null}
    </div>
  );
}
