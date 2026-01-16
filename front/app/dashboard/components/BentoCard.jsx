/**
 * Carte Bento pour le dashboard
 * Carte interactive avec icône, titre, sous-titre et effet hover
 */

import React from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ComponentVariant } from "@/app/constants/uiConstants";

/**
 * @param {Object} props
 * @param {string} props.title - Titre de la carte
 * @param {string} props.subtitle - Sous-titre/description
 * @param {React.Component} props.icon - Icône Lucide
 * @param {string} props.href - Lien de destination
 * @param {boolean} props.action - Afficher la flèche d'action
 * @param {string} props.variant - Variante de couleur (default, primary, secondary)
 */
export default function BentoCard({
  title,
  subtitle,
  icon: Icon,
  href,
  action,
  variant = ComponentVariant.DEFAULT,
}) {
  const theme = useTheme();

  // Couleur de fond selon la variante
  const getBgColor = () => {
    if (variant === ComponentVariant.PRIMARY) return theme.palette.primary.main;
    if (variant === ComponentVariant.SECONDARY)
      return theme.palette.secondary.main;
    return theme.palette.background.paper;
  };

  // Couleur du texte selon la variante
  const getTextColor = () => {
    if (
      variant === ComponentVariant.PRIMARY ||
      variant === ComponentVariant.SECONDARY
    )
      return "#fff";
    return theme.palette.text.primary;
  };

  return (
    <Link
      href={href || "#"}
      style={{ textDecoration: "none", display: "block", height: "100%" }}
    >
      <Paper
        elevation={0}
        className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        sx={{
          p: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          bgcolor: getBgColor(),
          color: getTextColor(),
          borderRadius: 4,
          border:
            variant === ComponentVariant.DEFAULT
              ? `1px solid ${theme.palette.divider}`
              : "none",
        }}
      >
        {/* En-tête avec icône et flèche */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
          }}
        >
          <Box
            sx={{
              p: 1.5,
              borderRadius: "14px",
              bgcolor:
                variant === ComponentVariant.DEFAULT
                  ? theme.palette.mode === "light"
                    ? "#f5f5f5"
                    : "rgba(255,255,255,0.1)"
                  : "rgba(255,255,255,0.2)",
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

        {/* Contenu */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                opacity: 0.8,
                fontWeight: 500,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Paper>
    </Link>
  );
}
