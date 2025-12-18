"use client";
import * as React from "react";
import { Box, Paper, Typography, Button, Stack, useTheme } from "@mui/material";
import {
  Plus,
  Calendar,
  Mail,
  MessageSquare,
  User,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const BentoCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  href, 
  action, 
  cols = 1, 
  rows = 1,
  variant = "default" 
}) => {
  const theme = useTheme();
  
  // Variantes de couleur pour les cartes
  const getBgColor = () => {
    if (variant === "primary") return theme.palette.primary.main;
    if (variant === "secondary") return theme.palette.secondary.main;
    return theme.palette.background.paper;
  };

  const getTextColor = () => {
    if (variant === "primary" || variant === "secondary") return "#fff";
    return theme.palette.text.primary;
  };

  return (
    <Link href={href || "#"} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <Paper
        elevation={0}
        className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
        sx={{
          p: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          bgcolor: getBgColor(),
          color: getTextColor(),
          borderRadius: 4,
          border: variant === "default" ? `1px solid ${theme.palette.divider}` : "none",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <Box 
            sx={{ 
              p: 1.5, 
              borderRadius: "14px",
              bgcolor: variant === "default" 
                ? (theme.palette.mode === 'light' ? '#f5f5f5' : 'rgba(255,255,255,0.1)')
                : 'rgba(255,255,255,0.2)'
            }}
          >
            <Icon size={24} />
          </Box>
          {action && (
            <Box 
              className="opacity-0 transition-opacity group-hover:opacity-100"
              sx={{ transform: "translateX(4px)" }}
            >
              <ArrowRight size={20} />
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.8,
                fontWeight: 500 
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Paper>
    </Link>
  );
};

export default function DashboardPage() {
  return (
    <Box>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" fontWeight="800" gutterBottom>
          Bonjour, Alex 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Voici ce qui se passe aujourd&apos;hui.
        </Typography>
      </Box>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px]">
        
        {/* Créer un événement (Grande carte) */}
        <div className="col-span-1 md:col-span-2 row-span-1">
          <BentoCard
            title="Créer un événement"
            subtitle="Planifiez une nouvelle soirée inoubliable"
            icon={Plus}
            href="/events/create"
            variant="primary"
            action
          />
        </div>

        {/* Mes événements */}
        <div className="col-span-1 row-span-1">
          <BentoCard
            title="Mes événements"
            subtitle="3 à venir"
            icon={Calendar}
            href="/events"
          />
        </div>

        {/* Invitations */}
        <div className="col-span-1 row-span-1">
          <BentoCard
            title="Invitations"
            subtitle="2 en attente"
            icon={Mail}
            href="/invitations"
            variant="secondary"
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
    </Box>
  );
}
