/**
 * Hook personnalisé pour récupérer les statistiques du dashboard
 * Charge les données dynamiques (événements à venir, invitations, etc.)
 */

import { useState, useEffect, useCallback } from "react";

/**
 * @param {string} token - Token d'authentification
 * @returns {Object} Statistiques du dashboard
 */
export function useDashboardStats(token) {
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    pendingInvitations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Récupérer les événements à venir
      const eventsRes = await fetch("/api/events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (eventsRes.ok) {
        const events = await eventsRes.json();
        const now = new Date();
        const upcoming = events.filter(
          (event) => new Date(event.startDate) > now
        );

        setStats((prev) => ({
          ...prev,
          upcomingEvents: upcoming.length,
        }));
      }

      // TODO: Récupérer les invitations en attente
      // const invitationsRes = await fetch("/api/invitations", {
      //   headers: { Authorization: `Bearer ${token}` },
      // });

      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
