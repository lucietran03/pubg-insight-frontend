import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
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

  useEffect(() => {
    getSeasonStats(playerId)
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err, "No season stats found for this player.")))
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) return null;

  return (
    <Box sx={{ textAlign: "center", py: 2 }}>
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
