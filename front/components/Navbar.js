"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Box, useMediaQuery, useTheme, alpha } from "@mui/material";
import { 
  LayoutDashboard, 
  Calendar, 
  Mail, 
  MessageSquare, 
  User 
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Événements", icon: Calendar, href: "/events" },
  { label: "Invitations", icon: Mail, href: "/invitations" },
  { label: "Messages", icon: MessageSquare, href: "/messages" },
  { label: "Profil", icon: User, href: "/profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  // Styles communs pour les items
  const getItemStyles = (isActive) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    p: 1.5,
    borderRadius: isDesktop ? "16px" : "50%", // Rond sur mobile, carré arrondi desktop
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    bgcolor: isActive ? alpha(theme.palette.primary.main, 0.1) : "transparent",
    transition: "all 0.2s ease",
    "&:hover": {
      bgcolor: isActive 
        ? alpha(theme.palette.primary.main, 0.15) 
        : alpha(theme.palette.text.primary, 0.05),
      color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
    },
  });

  if (isDesktop) {
    // DESKTOP: Navbar verticale flottante à gauche
    return (
      <Box
        component="nav"
        sx={{
          position: "fixed",
          left: 20,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 1200,
          bgcolor: "background.paper",
          borderRadius: 4,
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          boxShadow: theme.palette.mode === "light" 
            ? "0 4px 20px rgba(0,0,0,0.05)" 
            : "0 4px 20px rgba(0,0,0,0.3)",
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <Box sx={getItemStyles(isActive)} title={item.label}>
                <Icon size={24} />
              </Box>
            </Link>
          );
        })}
      </Box>
    );
  }

  // MOBILE: Navbar horizontale flottante en bas
  return (
    <Box
      component="nav"
      sx={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1200,
        bgcolor: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: "blur(12px)",
        borderRadius: 999, // Pill shape
        px: 3,
        py: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 3,
        boxShadow: theme.palette.mode === "light"
          ? "0 8px 32px rgba(0,0,0,0.1)"
          : "0 8px 32px rgba(0,0,0,0.4)",
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        width: "auto",
        maxWidth: "calc(100% - 32px)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
            <Box sx={getItemStyles(isActive)}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </Box>
          </Link>
        );
      })}
    </Box>
  );
}
