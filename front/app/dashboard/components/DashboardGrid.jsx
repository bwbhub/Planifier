/**
 * Grille de cartes du dashboard
 * Affiche toutes les cartes dans une disposition Bento Grid
 */

import React from "react";
import {
  Plus,
  Calendar,
  Mail,
  MessageSquare,
  User,
  Sparkles,
} from "lucide-react";
import BentoCard from "./BentoCard.jsx";
import { ComponentVariant } from "@/app/constants/uiConstants";

/**
 * @param {Object} props
 * @param {Object} props.stats - Statistiques du dashboard (événements, invitations, etc.)
 */
export default function DashboardGrid({ stats = {} }) {
  const { upcomingEvents, pendingInvitations } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px]">
      {/* Créer un événement (Grande carte) */}
      <div className="col-span-1 md:col-span-2 row-span-1">
        <BentoCard
          title="Créer un événement"
          subtitle="Planifiez une nouvelle soirée inoubliable"
          icon={Plus}
          href="/events/create"
          variant={ComponentVariant.PRIMARY}
          action
        />
      </div>

      {/* Mes événements */}
      <div className="col-span-1 row-span-1">
        <BentoCard
          title="Mes événements"
          subtitle={`${upcomingEvents} à venir`}
          icon={Calendar}
          href="/events"
        />
      </div>

      {/* Invitations */}
      <div className="col-span-1 row-span-1">
        <BentoCard
          title="Invitations"
          subtitle={`${pendingInvitations} en attente`}
          icon={Mail}
          href="/invitations"
          variant={ComponentVariant.SECONDARY}
        />
      </div>

      {/* Suggestions AI (Grande hauteur) */}
      <div className="col-span-1 row-span-2">
        <BentoCard
          title="Suggestions"
          subtitle="Idées basées sur vos intérêts"
          icon={Sparkles}
          href="/suggestions"
          action
        />
      </div>

      {/* Messages */}
      <div className="col-span-1 md:col-span-2 row-span-1">
        <BentoCard
          title="Messages"
          subtitle="Dernier message de Sarah il y a 2h"
          icon={MessageSquare}
          href="/messages"
        />
      </div>

      {/* Profil */}
      <div className="col-span-1 row-span-1">
        <BentoCard
          title="Mon Profil"
          subtitle="Gérer mon compte"
          icon={User}
          href="/profile"
        />
      </div>
    </div>
  );
}
