/**
 * Champs principaux du formulaire de création d'événement
 */

import React from "react";
import { TextField, Stack, Typography, Divider, Box } from "@mui/material";
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

      {/* Date et Heure de début */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
        <Stack spacing={2}>
          <Typography variant="body2" fontWeight="500">
            Début
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <DatePicker
              label="Date "
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
              label="Heure"
              value={formData.time}
              onChange={(newValue) => updateField("time", newValue)}
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
          </Stack>

          {/* Date et Heure de fin */}
          <Typography variant="body2" fontWeight="500" sx={{ mt: 1 }}>
            Fin
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <DatePicker
              label="Date de fin"
              value={formData.endDate}
              onChange={(newValue) => updateField("endDate", newValue)}
              disabled={disabled}
              minDate={formData.date}
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
            <TimePicker
              label="Heure de fin *"
              value={formData.endTime}
              onChange={(newValue) => updateField("endTime", newValue)}
              disabled={disabled || !formData.endDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: formData.endDate !== null,
                  sx: {
                    "& .MuiPickersOutlinedInput-root": {
                      borderRadius: "12px",
                    },
                  },
                },
              }}
            />
          </Stack>
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

      <Divider />

      {/* Couleur */}
      <Typography variant="h6" fontWeight="bold" color="primary">
        Couleur
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <input
          type="color"
          value={formData.color}
          onChange={(e) => updateField("color", e.target.value)}
          disabled={disabled}
          style={{
            width: "60px",
            height: "40px",
            border: "2px solid #ddd",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        />
        <Typography variant="body2" color="text.secondary">
          Choisissez une couleur pour identifier facilement votre événement dans
          le calendrier
        </Typography>
      </Box>
    </Stack>
  );
}
