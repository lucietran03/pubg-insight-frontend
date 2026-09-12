import { useEffect, useState } from "react";
import { Box, Divider, Skeleton, Typography } from "@mui/material";
import { getSeasonStats } from "../services/seasonStatsService";
import type { SeasonStats as SeasonStatsData } from "../types/seasonStats";
import { getErrorMessage } from "../utils/errorMessage";
import PerformanceRadar from "./PerformanceRadar";
import PlayerIdentityCard from "./PlayerIdentityCard";
import StatTile from "./StatTile";

interface SeasonStatsProps {
  playerId: string;
}

// Small "vs last season" indicator shown next to a stat tile. Omitted entirely by the
// caller when there's no previous season to compare against (e.g. a brand-new account),
// so this component never has to render an empty/placeholder state.
function DeltaIndicator({ deltaPct }: { deltaPct: number }) {
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

function SeasonStats({ playerId }: SeasonStatsProps) {
  const [stats, setStats] = useState<SeasonStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumping this re-runs the fetch effect for a manual retry, without the component
  // remounting the way a `playerId` change does (that's handled by the parent's `key`).
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    getSeasonStats(playerId)
      .then((result) => {
        setStats(result);
        setError(null);
      })
      .catch((err) => setError(getErrorMessage(err, "No season stats found for this player.")))
      .finally(() => setLoading(false));
  }, [playerId, retryToken]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryToken((token) => token + 1);
  };

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
          onClick={handleRetry}
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
      <PlayerIdentityCard archetype={stats.archetype} />

      <Typography variant="h3" sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1 }}>
        {(stats.winRate * 100).toFixed(1)}%
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Season Win Rate · {stats.wins} wins / {stats.roundsPlayed} rounds (all modes)
      </Typography>
      {comparison && <DeltaIndicator deltaPct={comparison.winRateDeltaPct} />}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
          gap: 1.5,
          mt: 2,
        }}
      >
        <Box>
          <StatTile label="Avg Damage" value={stats.avgDamage.toFixed(0)} />
          {comparison && <DeltaIndicator deltaPct={comparison.avgDamageDeltaPct} />}
        </Box>
        <Box>
          <StatTile label="K/D Ratio" value={stats.killDeathRatio.toFixed(2)} />
          {comparison && <DeltaIndicator deltaPct={comparison.killDeathRatioDeltaPct} />}
        </Box>
        <Box>
          <StatTile label="Headshot Rate" value={`${(stats.headshotRate * 100).toFixed(0)}%`} />
          {comparison && <DeltaIndicator deltaPct={comparison.headshotRateDeltaPct} />}
        </Box>
        <Box>
          <StatTile label="Top 10 Rate" value={`${(stats.top10Rate * 100).toFixed(0)}%`} />
          {comparison && <DeltaIndicator deltaPct={comparison.top10RateDeltaPct} />}
        </Box>
        <StatTile label="Avg Survival" value={`${Math.round(stats.avgSurvivalSeconds / 60)}m`} />
        <StatTile label="Longest Kill" value={`${stats.longestKillMeters.toFixed(0)}m`} />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="overline" color="text.secondary" sx={{ display: "block", textAlign: "center" }}>
        Performance Radar
      </Typography>
      <PerformanceRadar scores={stats.radar} />
    </Box>
  );
}

export default SeasonStats;
