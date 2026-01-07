/**
 * Hook personnalisé pour charger les détails d'un événement
 */

import { useState, useEffect, useCallback } from "react";

/**
 * @param {string} token - Token d'authentification
 * @param {string} eventId - ID de l'événement
 * @returns {Object} État de l'événement
 */
export function useEventDetail(token, eventId) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvent = useCallback(async () => {
    if (!token || !eventId) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Événement introuvable");
      }

      const data = await res.json();
      setEvent(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return {
    event,
    loading,
    error,
    refetch: fetchEvent,
  };
}
