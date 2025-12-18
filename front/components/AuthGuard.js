"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";

export default function AuthGuard({ children }) {
  const { user, loading, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.push("/login");
    }
  }, [user, loading, token, router]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          height: "100vh", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center" 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!token) {
    return null; // En train de rediriger
  }

  return <>{children}</>;
}
