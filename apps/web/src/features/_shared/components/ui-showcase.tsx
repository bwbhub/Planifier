"use client";

import { Badge } from "@planifier/ui/components/badge";
import { Button } from "@planifier/ui/components/button";
import { Checkbox } from "@planifier/ui/components/checkbox";
import { SegmentedControl } from "@planifier/ui/components/segmented-control";
import { SelectField } from "@planifier/ui/components/select-field";
import { Switch } from "@planifier/ui/components/switch";
import { Tabs } from "@planifier/ui/components/tabs";
import { TextAreaField } from "@planifier/ui/components/text-area-field";
import { TextField } from "@planifier/ui/components/text-field";
import { TitledSection } from "@planifier/ui/components/titled-section";
import { type ReactNode, useState } from "react";

import { DialogsDemo } from "./ui-showcase-dialogs";

const VIEWS = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
] as const;

const LISTS = [
  { value: "shopping", label: "Courses", count: 4 },
  { value: "work", label: "Travail", count: 0 },
  { value: "trip", label: "Voyage", count: 12 },
] as const;

type ListId = (typeof LISTS)[number]["value"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <TitledSection title={title} className="p-6">
      <div className="flex flex-col gap-4">{children}</div>
    </TitledSection>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

/** Les composants de base de `packages/ui`, chacun dans tous ses états (clair et nuit : le thème du profil). */
export function UiShowcase() {
  const [view, setView] = useState<(typeof VIEWS)[number]["value"]>("week");
  const [list, setList] = useState<ListId>("shopping");

  return (
    <div className="flex flex-col gap-6">
      <Section title="Boutons">
        <Row>
          <Button>Principal</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="outline">Contour</Button>
          <Button variant="strong">Fort</Button>
          <Button variant="ghost">Discret</Button>
        </Row>
        <Row>
          <Button size="sm">Petit</Button>
          <Button disabled>Désactivé</Button>
          <Button loading>Enregistrement…</Button>
        </Row>
      </Section>

      <Section title="Champs">
        <TextField label="Nom" placeholder="Alice" hint="Visible des membres de tes Espaces." />
        <TextField
          label="Adresse e-mail"
          defaultValue="alice@"
          error="Il manque la fin de l'adresse."
        />
        <TextField label="Verrouillé" defaultValue="Non modifiable" disabled />
        <TextAreaField label="Note" hint="Facultatif." />
        <SelectField
          label="Liste"
          options={[
            { value: "a", label: "Courses" },
            { value: "b", label: "Travail" },
          ]}
          error="Choisis une liste."
        />
      </Section>

      <Section title="Cases et interrupteurs">
        <Checkbox label="Se souvenir de moi" hint="Sur cet appareil seulement." />
        <Checkbox label="Désactivée" disabled />
        <Switch label="Rappels" hint="Un rappel la veille." />
        <Switch label="Déjà allumé" defaultChecked />
        <Switch label="Désactivé" disabled />
      </Section>

      <Section title="Onglets">
        <Tabs label="Mes listes" tabs={LISTS} value={list} onValueChange={setList}>
          <p>Contenu de l’onglet « {LISTS.find((tab) => tab.value === list)?.label} ».</p>
        </Tabs>
      </Section>

      <Section title="Contrôle segmenté">
        <SegmentedControl
          label="Vue"

          options={VIEWS}
          value={view}
          onValueChange={setView}
        />
      </Section>

      <Section title="Dialogues">
        <DialogsDemo />
      </Section>

      <Section title="Pastilles">
        <Row>
          <Badge>Membre</Badge>
          <Badge tone="accent">Propriétaire</Badge>
          <Badge tone="strong">3 non lues</Badge>
        </Row>
      </Section>
    </div>
  );
}
