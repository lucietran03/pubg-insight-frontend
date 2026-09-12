import { Box, Chip, Typography } from "@mui/material";

interface PlayerIdentityCardProps {
  archetype: string;
}

// Deterministic, per-archetype blurb - not Gemini-generated (that's a later phase: Gemini
// should only ever explain *why* a deterministic label was assigned, never invent the
// label itself). Placeholder wording until the AI Report phase adds a real per-player "why".
const ARCHETYPE_BLURBS: Record<string, string> = {
  "Frontline Eliminator": "Leads engagements and racks up kills at a high rate.",
  "Survival Specialist": "Prioritizes staying alive over early fights.",
  "Precision Hunter": "Lands a high share of headshots relative to total kills.",
  "Aggressive Fragger": "Deals heavy damage per round, favoring close engagements.",
  "Squad Anchor": "Supports the team through assists and revives.",
  "Consistent Competitor": "Reaches the top 10 at a high, steady rate.",
  "Balanced Operator": "No single standout trait — performs evenly across combat, survival, and support.",
};

function PlayerIdentityCard({ archetype }: PlayerIdentityCardProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 1.5 }}>
      <Chip label={archetype} color="primary" sx={{ fontWeight: 700 }} />
      <Typography variant="caption" color="text.secondary">
        {ARCHETYPE_BLURBS[archetype] ?? "Playstyle profile derived from this season's stats."}
      </Typography>
    </Box>
  );
}

export default PlayerIdentityCard;
