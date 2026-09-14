import { Typography } from "@mui/material";
import { keyframes } from "@emotion/react";

interface DeltaIndicatorProps {
  deltaPct: number;
}

// Comparison content: slides/fades in distinctly from progress content's fill-up animation,
// reading as "here's the contrast" rather than "here's a value being measured".
const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
`;

// Small "vs last season" indicator, shared by the compact season-overview card and the
// full performance breakdown - both compare the same SeasonComparison fields.
function DeltaIndicator({ deltaPct }: DeltaIndicatorProps) {
  const rounded = Math.round(deltaPct);

  if (rounded === 0) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
        No change vs last season
      </Typography>
    );
  }

  const isImprovement = rounded > 0;
  return (
    <Typography
      variant="caption"
      sx={{
        display: "block",
        mt: 0.25,
        fontWeight: 700,
        color: isImprovement ? "success.main" : "error.main",
        opacity: isImprovement ? 1 : 0.75,
        animation: `${slideIn} 0.4s ease-out`,
      }}
    >
      {isImprovement ? "▲" : "▼"} {Math.abs(rounded)}% vs last season
    </Typography>
  );
}

export default DeltaIndicator;
