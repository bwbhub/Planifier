"use client";
import React from "react";
import { Box } from "@mui/material";
import { useAuth } from "../../context/AuthContext";

// Composants
import DashboardHeader from "./components/DashboardHeader.jsx";
import DashboardGrid from "./components/DashboardGrid.jsx";

// Hooks
import { useDashboardStats } from "./hooks/useDashboardStats";

/**
 * Page du dashboard
 * Vue d'ensemble avec accès rapide aux principales fonctionnalités
 */
export default function DashboardPage() {
  const { user, token } = useAuth();
  const { stats, loading } = useDashboardStats(token);

  console.log("stats", stats);

  return (
    <Box>
      <DashboardHeader userName={user?.name} />
      <DashboardGrid stats={stats} />
    </Box>
  );
}
