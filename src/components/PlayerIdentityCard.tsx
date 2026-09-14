import { Box, Typography } from "@mui/material";
import type { RadarScores } from "../types/seasonStats";

interface PlayerIdentityCardProps {
  archetype: string;
  radar: RadarScores;
}

// Deterministic per-archetype text, not Gemini-generated - Gemini only explains why a label was assigned.
const ARCHETYPE_BLURBS: Record<string, string> = {
  "Frontline Eliminator": "Leads engagements and racks up kills at a high rate.",
  "Survival Specialist": "Prioritizes staying alive over early fights.",
  "Precision Hunter": "Lands a high share of headshots relative to total kills.",
  "Aggressive Fragger": "Deals heavy damage per round, favoring close engagements.",
  "Squad Anchor": "Supports the team through assists and revives.",
  "Consistent Competitor": "Reaches the top 10 at a high, steady rate.",
  "Balanced Operator": "No single standout trait — performs evenly across combat, survival, and support.",
};

// Archetype is assigned backend-side as the highest-scoring radar axis; this maps it back for display.
const ARCHETYPE_AXIS: Record<string, keyof RadarScores | undefined> = {
  "Frontline Eliminator": "combat",
  "Survival Specialist": "survival",
  "Precision Hunter": "precision",
  "Aggressive Fragger": "aggression",
  "Squad Anchor": "support",
  "Consistent Competitor": "consistency",
};

const AXIS_LABELS: Record<keyof RadarScores, string> = {
  combat: "Combat",
  survival: "Survival",
  precision: "Precision",
  aggression: "Aggression",
  support: "Support",
  consistency: "Consistency",
};

// Qualitative label derived from how far the driving axis leads the rest, not a separate backend value.
function classificationLabel(axisScore: number, otherScores: number[]): string {
  const avgOthers = otherScores.reduce((sum, value) => sum + value, 0) / otherScores.length;
  const margin = axisScore - avgOthers;
  if (margin >= 25) return "Dominant trait";
  if (margin >= 12) return "Strong trait";
  return "Emerging trait";
}

// No bordered card here - it would just be another rectangle next to the player identity block above it.
function PlayerIdentityCard({ archetype, radar }: PlayerIdentityCardProps) {
  const axis = ARCHETYPE_AXIS[archetype];
  const allScores = Object.values(radar);
  const axisScore = axis ? radar[axis] : undefined;
  const otherScores = axis
    ? (Object.keys(radar) as Array<keyof RadarScores>).filter((key) => key !== axis).map((key) => radar[key])
    : [];
  const spread = Math.max(...allScores) - Math.min(...allScores);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "2px",
            bgcolor: "primary.main",
            transform: "rotate(45deg)",
            flexShrink: 0,
          }}
        />
        <Typography
          variant="subtitle1"
          component="h3"
          sx={{ fontWeight: 800, color: "primary.main", letterSpacing: 0.2, lineHeight: 1.15 }}
        >
          {archetype}
        </Typography>
      </Box>

      {axis && axisScore !== undefined ? (
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          {AXIS_LABELS[axis]} {axisScore}/100 · {classificationLabel(axisScore, otherScores)}
        </Typography>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          Even spread · {spread}pt range across all roles
        </Typography>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
        {ARCHETYPE_BLURBS[archetype] ?? "Playstyle profile derived from this season's stats."}
      </Typography>
    </Box>
  );
}

export default PlayerIdentityCard;
