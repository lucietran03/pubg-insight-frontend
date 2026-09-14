import { Box, Typography } from "@mui/material";

interface RecentFormChipProps {
  winRateDeltaPct: number;
}

// Compact pill version of DeltaIndicator's win-rate comparison, sized for the identity row rather than a stat tile.
function RecentFormChip({ winRateDeltaPct }: RecentFormChipProps) {
  const rounded = Math.round(winRateDeltaPct);
  if (rounded === 0) return null;

  const isImprovement = rounded > 0;
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.25,
        py: 0.5,
        borderRadius: "999px",
        border: "1px solid",
        borderColor: isImprovement ? "success.main" : "error.main",
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, color: isImprovement ? "success.main" : "error.main" }}
      >
        {isImprovement ? "▲" : "▼"} {Math.abs(rounded)}% win rate vs last season
      </Typography>
    </Box>
  );
}

export default RecentFormChip;
