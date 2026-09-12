import { useEffect, useState } from "react";
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
import { getSeasonStats } from "../services/seasonStatsService";
import type { Player } from "../types/player";
import type { SeasonStats as SeasonStatsData } from "../types/seasonStats";
import { getErrorMessage } from "../utils/errorMessage";
import MatchList from "./MatchList";
import PerformanceBreakdown from "./PerformanceBreakdown";
import SeasonStats from "./SeasonStats";
import SectionTitle from "./SectionTitle";

function PlayerSearch() {
  const [name, setName] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetched once here (not inside SeasonStats) so both the compact "Season Performance"
  // card and the full-width "Performance Breakdown" card below it can share the same
  // data without a duplicate PUBG-backed call.
  const [seasonStats, setSeasonStats] = useState<SeasonStatsData | null>(null);
  const [seasonStatsLoading, setSeasonStatsLoading] = useState(false);
  const [seasonStatsError, setSeasonStatsError] = useState<string | null>(null);
  const [seasonStatsRetryToken, setSeasonStatsRetryToken] = useState(0);

  // The synchronous "start loading" resets happen in the two event handlers below (search,
  // retry), not here - a `set-state-in-effect` lint rule forbids calling setState directly
  // in an effect body; only the async .then/.catch/.finally callbacks are allowed to.
  useEffect(() => {
    if (!player) return;

    getSeasonStats(player.id)
      .then((result) => setSeasonStats(result))
      .catch((err) => setSeasonStatsError(getErrorMessage(err, "No season stats found for this player.")))
      .finally(() => setSeasonStatsLoading(false));
  }, [player, seasonStatsRetryToken]);

  const handleSeasonStatsRetry = () => {
    setSeasonStatsLoading(true);
    setSeasonStatsError(null);
    setSeasonStatsRetryToken((token) => token + 1);
  };

  const handleSearch = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setLoading(true);
    setError(null);
    setPlayer(null);
    setSeasonStats(null);
    setSeasonStatsError(null);

    try {
      const result = await searchPlayer(trimmedName);
      setPlayer(result);
      setSeasonStatsLoading(true);
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
                <SectionTitle>Player Overview</SectionTitle>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      color: "background.default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1.5rem",
                      flexShrink: 0,
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, wordBreak: "break-word", lineHeight: 1.2 }}>
                      {player.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                      {player.shardId.toUpperCase()} · {player.recentMatchIds.length} matches (14 days)
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <SectionTitle>Season Performance</SectionTitle>
                <SeasonStats
                  stats={seasonStats}
                  loading={seasonStatsLoading}
                  error={seasonStatsError}
                  onRetry={handleSeasonStatsRetry}
                />
              </CardContent>
            </Card>
          </Box>

          {seasonStats && (
            <Card sx={{ mt: 2 }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <SectionTitle>Performance Breakdown</SectionTitle>
                <PerformanceBreakdown stats={seasonStats} />
              </CardContent>
            </Card>
          )}

          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <SectionTitle>Recent Matches</SectionTitle>
              <MatchList playerId={player.id} matchIds={player.recentMatchIds} />
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}

export default PlayerSearch;
