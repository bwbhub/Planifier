/**
 * Champs principaux du formulaire de création d'événement
 */

import React from "react";
import { TextField, Stack, Typography, Divider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { fr } from "date-fns/locale";
import { FileText, MapPin } from "lucide-react";

/**
 * @param {Object} props
 * @param {Object} props.formData - Données du formulaire
 * @param {Function} props.updateField - Fonction de mise à jour des champs
 * @param {boolean} props.disabled - État désactivé
 */
export default function EventFormFields({ formData, updateField, disabled }) {
  return (
    <Stack spacing={3}>
      <Typography variant="h6" fontWeight="bold" color="primary">
        Informations principales
      </Typography>

      {/* Nom de l'événement */}
      <TextField
        fullWidth
        required
        label="Nom de l'événement"
        placeholder="Ex: Soirée jeux de société"
        value={formData.name}
        onChange={(e) => updateField("name", e.target.value)}
        disabled={disabled}
        InputProps={{
          startAdornment: <FileText size={20} style={{ marginRight: 8 }} />,
        }}
      />

      {/* Date et Heure */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <DatePicker
            label="Date *"
            value={formData.date}
            onChange={(newValue) => updateField("date", newValue)}
            disabled={disabled}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                sx: {
                  "& .MuiPickersOutlinedInput-root": {
                    borderRadius: "12px",
                  },
                },
              },
            }}
          />
          <TimePicker
            label="Heure (optionnelle)"
            value={formData.time}
            onChange={(newValue) => updateField("time", newValue)}
            disabled={disabled}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: {
                  "& .MuiPickersOutlinedInput-root": {
                    borderRadius: "12px",
                  },
                },
              },
            }}
          />
        </Stack>
      </LocalizationProvider>

      {/* Lieu */}
      <TextField
        fullWidth
        label="Lieu"
        placeholder="Ex: Chez Marie, 12 rue de la Paix"
        value={formData.location}
        onChange={(e) => updateField("location", e.target.value)}
        disabled={disabled}
        InputProps={{
          startAdornment: <MapPin size={20} style={{ marginRight: 8 }} />,
        }}
      />

      <Divider />

      {/* Description */}
      <Typography variant="h6" fontWeight="bold" color="primary">
        Description
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Description (optionnelle)"
        placeholder="Décrivez votre événement..."
        value={formData.description}
        onChange={(e) => updateField("description", e.target.value)}
        disabled={disabled}
      />
    </Stack>
  );
}
