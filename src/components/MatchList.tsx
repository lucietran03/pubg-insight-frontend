import { useState } from "react";
import { Alert, Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { getMatchStats } from "../services/matchService";
import type { Match } from "../types/match";
import { getErrorMessage } from "../utils/errorMessage";
import StatTile from "./StatTile";

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
    } catch (err) {
      setError(getErrorMessage(err, "This match could not be found for this player."));
    } finally {
      setLoading(false);
    }
  };

  if (matchIds.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No recent matches (PUBG only exposes roughly the last 14 days).
      </Typography>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          maxHeight: 220,
          overflowY: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
          gap: 1,
          pr: 0.5,
        }}
      >
        {matchIds.map((matchId) => (
          <Chip
            key={matchId}
            label={matchId.slice(0, 8)}
            color={matchId === selectedMatchId ? "primary" : "default"}
            onClick={() => handleSelect(matchId)}
            sx={{ fontFamily: "monospace", cursor: "pointer" }}
          />
        ))}
      </Box>

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
        <Box sx={{ mt: 2, bgcolor: "background.default", borderRadius: 2, p: 2 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {match.mapName}
            </Typography>
            <Chip label={match.gameMode} size="small" />
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
            <StatTile label="Placement" value={`#${match.winPlace}`} />
            <StatTile label="Kills" value={match.kills} />
            <StatTile label="Headshot" value={`${(match.headshotRate * 100).toFixed(0)}%`} />
            <StatTile label="Damage" value={match.damageDealt.toFixed(0)} />
            <StatTile label="Survived" value={`${Math.round(match.timeSurvivedSeconds / 60)}m`} />
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default MatchList;
