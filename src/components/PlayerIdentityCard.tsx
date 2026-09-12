import { Box, Typography } from "@mui/material";
import type { RadarScores } from "../types/seasonStats";

interface PlayerIdentityCardProps {
  archetype: string;
  radar: RadarScores;
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

// The archetype is deterministically assigned backend-side as the single highest-scoring
// radar axis (or "Balanced Operator" when the spread across axes is small). This maps each
// archetype back to the axis that drove it, so we can surface the actual score as a
// classification alongside the label rather than showing it as a floating, unexplained badge.
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

// Qualitative read on how much the driving axis stands out from the rest of the radar -
// a rough "confidence" of the classification, not a separate backend value.
function classificationLabel(axisScore: number, otherScores: number[]): string {
  const avgOthers = otherScores.reduce((sum, value) => sum + value, 0) / otherScores.length;
  const margin = axisScore - avgOthers;
  if (margin >= 25) return "Dominant trait";
  if (margin >= 12) return "Strong trait";
  return "Emerging trait";
}

function PlayerIdentityCard({ archetype, radar }: PlayerIdentityCardProps) {
  const axis = ARCHETYPE_AXIS[archetype];
  const allScores = Object.values(radar);
  const axisScore = axis ? radar[axis] : undefined;
  const otherScores = axis
    ? (Object.keys(radar) as Array<keyof RadarScores>).filter((key) => key !== axis).map((key) => radar[key])
    : [];
  const spread = Math.max(...allScores) - Math.min(...allScores);

  return (
    <Box sx={{ mb: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          columnGap: 1,
          rowGap: 0.25,
          flexWrap: "wrap",
          borderLeft: "3px solid",
          borderColor: "primary.main",
          pl: 1.25,
        }}
      >
        <Typography
          variant="h6"
          component="h3"
          sx={{ fontWeight: 800, color: "primary.main", letterSpacing: 0.2, lineHeight: 1.15 }}
        >
          {archetype}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
          {axis && axisScore !== undefined
            ? `${AXIS_LABELS[axis]} ${axisScore}/100 · ${classificationLabel(axisScore, otherScores)}`
            : `Even spread · ${spread}pt range across all roles`}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, pl: 1.25 }}>
        {ARCHETYPE_BLURBS[archetype] ?? "Playstyle profile derived from this season's stats."}
      </Typography>
    </Box>
  );
}

export default PlayerIdentityCard;
