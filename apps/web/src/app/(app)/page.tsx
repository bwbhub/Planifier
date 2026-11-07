import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/account";
import { TodayView } from "@/features/today";
import { pageTitle } from "@/lib/labels";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: pageTitle("Aujourd'hui") };

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user === null) redirect(ROUTES.signIn);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 pt-4 pb-10">
      <TodayView name={user.name} modules={user.modules} />
    </main>
  );
}
