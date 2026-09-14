import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import api from "./api/axios";
import { getPlayerById, searchPlayer } from "./services/playerService";
import type { Player } from "./types/player";
import { getErrorMessage } from "./utils/errorMessage";
import PlayerDashboard from "./components/PlayerDashboard";
import Sidebar from "./components/Sidebar";

function App() {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
  // True from first render when a share link is present, so there's no flash of the
  // "search to get started" empty state before the shared-player fetch below resolves.
  const [loading, setLoading] = useState(() => new URLSearchParams(window.location.search).has("playerId"));
  const [error, setError] = useState<string | null>(null);
  // Set once from ?playerId=&matchId= (the share link's CTA), so MatchList can auto-select
  // the shared match instead of landing on an empty "search to get started" screen.
  const [initialMatchId, setInitialMatchId] = useState<string | undefined>(undefined);
  // Bumped after a new analysis is recorded so the sidebar's history list re-fetches.
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);

  useEffect(() => {
    api
      .get("/health")
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedPlayerId = params.get("playerId");
    const sharedMatchId = params.get("matchId");
    if (!sharedPlayerId) return;

    getPlayerById(sharedPlayerId)
      .then((result) => {
        setPlayer(result);
        setName(result.name);
        if (sharedMatchId) setInitialMatchId(sharedMatchId);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load the shared analysis.")))
      .finally(() => setLoading(false));
  }, []);

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
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100vh" }}>
      <Sidebar
        name={name}
        onNameChange={setName}
        onSearch={handleSearch}
        loading={loading}
        player={player}
        backendOnline={backendOnline}
        historyRefreshToken={historyRefreshToken}
      />

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2.5, md: 4 } }}>
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

          {!loading && !error && !player && (
            <Box sx={{ textAlign: "center", mt: 8 }}>
              <Typography variant="h6" color="text.secondary">
                Search a PUBG player to get started
              </Typography>
            </Box>
          )}

          {player && (
            <PlayerDashboard
              key={player.id}
              player={player}
              initialMatchId={initialMatchId}
              onAnalysisRecorded={() => setHistoryRefreshToken((token) => token + 1)}
            />
          )}
        </Box>
        <Box sx={{ borderTop: "1px solid", borderColor: "divider", mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", py: 2 }}>
            Tran Dong Nghi · s3914633 · RMIT Vietnam University
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
