import { Button, CircularProgress } from "@mui/material";
import { Unplug } from "lucide-react";
import React, { useState } from "react";

const DisconnectButton = () => {
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <Button
      type="submit"
      variant="outlined"
      fullWidth
      disabled={disconnecting}
      onClick={handleDisconnect}
      startIcon={
        disconnecting ? <CircularProgress size={20} /> : <Unplug size={20} />
      }
      sx={{ mt: 2 }}
    >
      {disconnecting ? "Déconnexion..." : "Déconnexion"}
    </Button>
  );
};

export default DisconnectButton;
