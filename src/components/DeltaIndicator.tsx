import { Typography } from "@mui/material";
import { keyframes } from "@emotion/react";

interface DeltaIndicatorProps {
  deltaPct: number;
}

// Slides/fades in distinctly from a fill-up animation, reading as contrast rather than a value being measured.
const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: translateX(0); }
`;

// Shared by both season-overview and performance-breakdown cards since both compare the same SeasonComparison fields.
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
