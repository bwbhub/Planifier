/**
 * Hook personnalisé pour gérer le profil utilisateur
 * Gère le chargement et la mise à jour des données du profil
 */

import { useState, useEffect, useCallback } from "react";

/**
 * @param {string} token - Token d'authentification
 * @param {Function} updateUser - Fonction pour mettre à jour le contexte utilisateur
 * @returns {Object} État et fonctions du profil
 */
export function useProfile(token, updateUser) {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    preferredTheme: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Chargement du profil
  const fetchProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement du profil");
      }

      setProfile({
        name: data.name || "",
        email: data.email || "",
        preferredTheme: data.preferredTheme || "",
      });
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Sauvegarde du profil
  const saveProfile = async (updateData) => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      setSuccess("Profil mis à jour avec succès !");
      updateUser(data);

      // Mettre à jour le profil local
      setProfile({
        name: data.name || "",
        email: data.email || "",
        preferredTheme: data.preferredTheme || "",
      });

      // Faire disparaître le message après 3 secondes
      setTimeout(() => setSuccess(""), 3000);

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    error,
    success,
    setError,
    setSuccess,
    saveProfile,
  };
}
