/**
 * Section d'informations principales de l'événement
 */

import React from "react";
import { Paper, Typography, Stack, Box, Avatar } from "@mui/material";
import { MapPin, FileText, User } from "lucide-react";

/**
 * @param {Object} props
 * @param {Object} props.event - Événement
 * @param {Object} props.organizer - Organisateur
 */
export default function EventInfo({ event, organizer }) {
  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Informations
      </Typography>

      <Stack spacing={2.5}>
        {/* Lieu */}
        {event.location && (
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <MapPin size={20} style={{ marginTop: 2, flexShrink: 0 }} />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Lieu
              </Typography>
              <Typography variant="body1">{event.location}</Typography>
            </Box>
          </Stack>
        )}

        {/* Description */}
        {event.description && (
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <FileText size={20} style={{ marginTop: 2, flexShrink: 0 }} />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Description
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {event.description}
              </Typography>
            </Box>
          </Stack>
        )}

        {/* Organisateur */}
        {organizer && (
          <Stack direction="row" spacing={2} alignItems="center">
            <User size={20} style={{ flexShrink: 0 }} />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Organisateur
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  src={organizer.avatarUrl}
                  sx={{ width: 24, height: 24 }}
                >
                  {organizer.name?.[0]}
                </Avatar>
                <Typography variant="body1">{organizer.name}</Typography>
              </Stack>
            </Box>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
