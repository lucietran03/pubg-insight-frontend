import { Box, Skeleton, Typography } from "@mui/material";
import type { SeasonStats as SeasonStatsData } from "../types/seasonStats";
import DeltaIndicator from "./DeltaIndicator";

interface SeasonStatsProps {
  stats: SeasonStatsData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

// Full stat grid and radar live in PerformanceBreakdown so this card matches its sibling's height.
function SeasonStats({ stats, loading, error, onRetry }: SeasonStatsProps) {
  if (loading) {
    return (
      <Box sx={{ mt: 1, textAlign: "center" }}>
        <Skeleton variant="text" width="50%" height={48} sx={{ mx: "auto" }} />
        <Skeleton variant="text" width="80%" height={20} sx={{ mt: 0.5, mx: "auto" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          ⚠ {error}
        </Typography>
        <Typography
          variant="caption"
          onClick={onRetry}
          sx={{ color: "primary.main", fontWeight: 700, cursor: "pointer" }}
        >
          Tap to retry
        </Typography>
      </Box>
    );
  }

  if (!stats) return null;

  const comparison = stats.previousSeasonComparison;

  return (
    <Box sx={{ mt: 1, textAlign: "center" }}>
      <Typography variant="h3" sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1 }}>
        {(stats.winRate * 100).toFixed(1)}%
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        SEASON WIN RATE
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
        {pluralize(stats.wins, "win")} · {pluralize(stats.roundsPlayed, "round")} · all modes
      </Typography>
      {comparison && <DeltaIndicator deltaPct={comparison.winRateDeltaPct} />}
    </Box>
  );
}

export default SeasonStats;
