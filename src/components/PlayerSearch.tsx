import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
    <Box sx={{ maxWidth: 480, mt: 4 }}>
      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          label="PUBG player name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button variant="contained" onClick={handleSearch} disabled={loading}>
          Search
        </Button>
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

      {player && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6">{player.name}</Typography>
            <Typography color="text.secondary">Shard: {player.shardId}</Typography>
            <Typography color="text.secondary">
              Recent matches: {player.recentMatchIds.length}
            </Typography>
            <SeasonStats key={player.id} playerId={player.id} />
          </CardContent>
        </Card>
      )}

      {player && <MatchList playerId={player.id} matchIds={player.recentMatchIds} />}
    </Box>
  );
}

export default PlayerSearch;
