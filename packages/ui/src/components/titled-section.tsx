import { type ReactNode, useId } from "react";

import { Card, type CardPadding } from "./card";

export interface TitledSectionProps {
  /** Titre de la section : un `h2`, qui nomme aussi la région. */
  title: string;
  padding?: CardPadding;
  className?: string;
  children: ReactNode;
}

/** Carte nommée par son titre (`h2` + `aria-labelledby`). Sans métier : le contenu est au parent. */
export function TitledSection({
  title,
  padding = "md",
  className = "",
  children,
}: TitledSectionProps) {
  const titleId = useId();
  return (
    <Card as="section" aria-labelledby={titleId} padding={padding} className={className}>
      <h2 id={titleId} className="mb-4 font-display text-xl font-bold">
        {title}
      </h2>
      {children}
    </Card>
  );
}
