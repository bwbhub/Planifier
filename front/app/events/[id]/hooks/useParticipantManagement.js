import { useState, useEffect, useCallback } from "react";

/**
 * Hook pour gérer la logique du drawer de gestion des participants
 */
export function useParticipantManagement(token, eventId, open) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inviting, setInviting] = useState(null);
  const [email, setEmail] = useState("");
  const [invitingByEmail, setInvitingByEmail] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Charger la liste d'amis
  const loadFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/api/friends", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setFriends(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Inviter un ami à l'événement
  const handleInviteFriend = async (friendId) => {
    setInviting(friendId);
    try {
      const res = await fetch(
        `http://localhost:4000/api/events/${eventId}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: friendId }),
        }
      );
      if (!res.ok) throw new Error("Erreur d'invitation");
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(null);
    }
  };

  // Inviter par email
  const handleInviteByEmail = async () => {
    if (!email || !email.includes("@")) {
      setError("Veuillez entrer un email valide");
      return;
    }

    setInvitingByEmail(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(
        `http://localhost:4000/api/events/${eventId}/invite-by-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur d'invitation");
      }

      setSuccessMessage(data.message);
      setEmail("");

      if (data.userExists) {
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setInvitingByEmail(false);
    }
  };

  useEffect(() => {
    if (open && token) {
      loadFriends();
    }
  }, [open, token, loadFriends]);

  return {
    friends,
    loading,
    error,
    inviting,
    email,
    setEmail,
    invitingByEmail,
    successMessage,
    setError,
    setSuccessMessage,
    handleInviteFriend,
    handleInviteByEmail,
  };
}
