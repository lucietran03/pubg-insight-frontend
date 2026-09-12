import { Box, Skeleton, Typography } from "@mui/material";
import type { SeasonStats as SeasonStatsData } from "../types/seasonStats";
import DeltaIndicator from "./DeltaIndicator";
import PlayerIdentityCard from "./PlayerIdentityCard";

interface SeasonStatsProps {
  stats: SeasonStatsData | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

// Compact card content: identity + headline win rate only. The full stat grid and
// performance radar live in the separate, full-width PerformanceBreakdown card so this
// one stays roughly the same height as its sibling "Player Overview" card.
function SeasonStats({ stats, loading, error, onRetry }: SeasonStatsProps) {
  if (loading) {
    return (
      <Box sx={{ mt: 1 }}>
        <Skeleton variant="text" width="50%" height={48} />
        <Skeleton variant="text" width="80%" height={20} sx={{ mt: 0.5 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
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
    <Box sx={{ mt: 1 }}>
      <PlayerIdentityCard archetype={stats.archetype} radar={stats.radar} />

      <Typography variant="h3" sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1, pl: 0.25 }}>
        {(stats.winRate * 100).toFixed(1)}%
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, pl: 0.25 }}>
        Season Win Rate · {stats.wins} wins / {stats.roundsPlayed} rounds (all modes)
      </Typography>
      {comparison && <DeltaIndicator deltaPct={comparison.winRateDeltaPct} />}
    </Box>
  );
}

export default SeasonStats;
