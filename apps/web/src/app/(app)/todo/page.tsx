import type { Metadata } from "next";

import { PageHeader } from "@planifier/ui/components/page-header";
import { TodoView } from "@/features/todo";

export const metadata: Metadata = { title: "Todo · Planifier" };

interface TodoPageProps {
  searchParams: Promise<{ liste?: string | string[] }>;
}

// Accès réservé aux comptes connectés : garde du layout `(app)`.
export default async function TodoPage({ searchParams }: TodoPageProps) {
  const { liste } = await searchParams;
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 pt-4 pb-10">
      <PageHeader title="Todo" />
      <TodoView selectedListId={typeof liste === "string" ? liste : null} />
    </main>
  );
}
