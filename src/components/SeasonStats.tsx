import { useEffect, useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import { getSeasonStats } from "../services/seasonStatsService";
import type { SeasonStats as SeasonStatsData } from "../types/seasonStats";
import { getErrorMessage } from "../utils/errorMessage";

interface SeasonStatsProps {
  playerId: string;
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

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="h3" sx={{ fontWeight: 800, color: "primary.main", lineHeight: 1 }}>
        {(stats.winRate * 100).toFixed(1)}%
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Season Win Rate · {stats.wins} wins / {stats.roundsPlayed} rounds (all modes)
      </Typography>
    </Box>
  );
}

export default SeasonStats;
