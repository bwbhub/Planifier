import { Button, CircularProgress } from "@mui/material";
import { Trash2 } from "lucide-react";
import React, { useState } from "react";

/**
 *
 * @param {Object} props
 * @param {Object} props.profile
 */
const DeleteButton = ({ profile }) => {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la suppression du compte");
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      type="submit"
      variant="outlined"
      fullWidth
      disabled={deleting}
      onClick={handleDelete}
      startIcon={
        deleting ? <CircularProgress size={20} /> : <Trash2 size={20} />
      }
      sx={{ mt: 2 }}
    >
      {deleting ? "Suppression..." : "Supprimer le compte"}
    </Button>
  );
};

export default DeleteButton;
