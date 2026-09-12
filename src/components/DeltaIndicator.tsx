import { Typography } from "@mui/material";

interface DeltaIndicatorProps {
  deltaPct: number;
}

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
      }}
    >
      {isImprovement ? "▲" : "▼"} {Math.abs(rounded)}% vs last season
    </Typography>
  );
}

export default DeltaIndicator;
