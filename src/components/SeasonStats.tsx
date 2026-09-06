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
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
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
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2">
        Season Win Rate: {(stats.winRate * 100).toFixed(1)}%
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {stats.wins} wins / {stats.roundsPlayed} rounds played (all modes combined)
      </Typography>
    </Box>
  );
}

export default SeasonStats;
