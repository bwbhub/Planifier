"use client";

import { Button } from "@planifier/ui/components/button";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/lib/routes";

import { useSignOut } from "../queries/auth.queries";
import { authErrorMessage } from "../utils/auth-error-message";

export function SignOutButton() {
  const router = useRouter();
  const signOut = useSignOut();

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant="secondary"
        disabled={signOut.isPending}
        onClick={() => {
          signOut.mutate(undefined, {
            onSuccess: () => {
              router.replace(ROUTES.signIn);
              router.refresh();
            },
          });
        }}
      >
        {signOut.isPending ? "Déconnexion…" : "Se déconnecter"}
      </Button>
      {signOut.isError ? (
        <p role="alert" className="text-sm text-accent-text">
          {authErrorMessage(signOut.error)}
        </p>
      ) : null}
    </div>
  );
}
