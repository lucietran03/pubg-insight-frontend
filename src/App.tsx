import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Container, Typography } from "@mui/material";
import api from "./api/axios";
import { searchPlayer } from "./services/playerService";
import type { Player } from "./types/player";
import { getErrorMessage } from "./utils/errorMessage";
import PlayerDashboard from "./components/PlayerDashboard";
import Sidebar from "./components/Sidebar";

function App() {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumped after a new analysis is recorded so the sidebar's history list re-fetches.
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);

  useEffect(() => {
    api
      .get("/health")
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
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
        <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
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
              onAnalysisRecorded={() => setHistoryRefreshToken((token) => token + 1)}
            />
          )}
        </Container>
        <Box sx={{ borderTop: "1px solid", borderColor: "divider", mt: 2 }}>
          <Container maxWidth="xl">
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", py: 2 }}>
              Tran Dong Nghi · s3914633 · RMIT Vietnam University
            </Typography>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
