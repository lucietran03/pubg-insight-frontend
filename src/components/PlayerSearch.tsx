import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { searchPlayer } from "../services/playerService";
import type { Player } from "../types/player";
import { getErrorMessage } from "../utils/errorMessage";
import MatchList from "./MatchList";
import SeasonStats from "./SeasonStats";

function PlayerSearch() {
  const [name, setName] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setLoading(true);
    setError(null);
    setPlayer(null);

    try {
      const result = await searchPlayer(trimmedName);
      setPlayer(result);
    } catch (err) {
      setError(getErrorMessage(err, `Could not find player "${trimmedName}"`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "8px",
          p: { xs: 2, md: 2.5 },
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            placeholder="Enter a PUBG player name (steam shard)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            slotProps={{ input: { sx: { fontSize: "1.05rem", py: 0.5 } } }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            sx={{ px: 4, fontWeight: 700, letterSpacing: 0.5 }}
          >
            Search
          </Button>
        </Stack>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {/* Single key on this wrapper (not on SeasonStats/MatchList individually) so the
          whole section remounts cleanly per player - two sibling elements with the same
          key value would otherwise trigger a real React "duplicate key" warning. */}
      {player && (
        <Box key={player.id} sx={{ mt: 3 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="overline" color="text.secondary">
                  PLAYER OVERVIEW
                </Typography>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1, flexWrap: "wrap" }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, wordBreak: "break-word" }}>
                    {player.name}
                  </Typography>
                  <Chip label={player.shardId.toUpperCase()} size="small" color="secondary" />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {player.recentMatchIds.length} matches in the last 14 days
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="overline" color="text.secondary">
                  SEASON PERFORMANCE
                </Typography>
                <SeasonStats playerId={player.id} />
              </CardContent>
            </Card>
          </Box>

          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="overline" color="text.secondary" gutterBottom>
                RECENT MATCHES
              </Typography>
              <MatchList playerId={player.id} matchIds={player.recentMatchIds} />
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}

export default PlayerSearch;
