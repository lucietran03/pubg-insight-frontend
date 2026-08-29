import { useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { getMatchStats } from "../services/matchService";
import type { Match } from "../types/match";

interface MatchListProps {
  playerId: string;
  matchIds: string[];
}

function MatchList({ playerId, matchIds }: MatchListProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (matchId: string) => {
    setSelectedMatchId(matchId);
    setMatch(null);
    setError(null);
    setLoading(true);

    try {
      const result = await getMatchStats(playerId, matchId);
      setMatch(result);
    } catch {
      setError("Could not load stats for this match.");
    } finally {
      setLoading(false);
    }
  };

  if (matchIds.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        No recent matches (PUBG only exposes roughly the last 14 days).
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Recent matches
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {matchIds.map((matchId) => (
          <Chip
            key={matchId}
            label={matchId.slice(0, 8)}
            color={matchId === selectedMatchId ? "primary" : "default"}
            onClick={() => handleSelect(matchId)}
          />
        ))}
      </Stack>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {match && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle1">
              {match.mapName} — {match.gameMode}
            </Typography>
            <Typography color="text.secondary">Placement: #{match.winPlace}</Typography>
            <Typography color="text.secondary">Kills: {match.kills}</Typography>
            <Typography color="text.secondary">
              Headshot rate: {(match.headshotRate * 100).toFixed(0)}%
            </Typography>
            <Typography color="text.secondary">
              Damage dealt: {match.damageDealt.toFixed(0)}
            </Typography>
            <Typography color="text.secondary">
              Survived: {Math.round(match.timeSurvivedSeconds / 60)} min
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default MatchList;
