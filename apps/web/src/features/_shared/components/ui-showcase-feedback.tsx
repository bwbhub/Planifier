"use client";

import { Section } from "./showcase-section";
import { DialogsDemo } from "./ui-showcase-dialogs";
import { MenuDemo } from "./ui-showcase-menu";
import { StatesDemo } from "./ui-showcase-states";
import { ToastsDemo } from "./ui-showcase-toasts";

/** Ce qui répond à l'utilisateur ou se superpose à la page : états, menu, messages, dialogues. */
export function FeedbackSections() {
  return (
    <>
      <Section title="Chargement, vide, erreur">
        <StatesDemo />
      </Section>

      <Section title="Menu">
        <MenuDemo />
      </Section>

      <Section title="Messages">
        <ToastsDemo />
      </Section>

      <Section title="Dialogues">
        <DialogsDemo />
      </Section>
    </>
  );
}
