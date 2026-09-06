import { useEffect, useState } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import api from "./api/axios";
import PlayerSearch from "./components/PlayerSearch";

function App() {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .get("/health")
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const statusColor =
    backendOnline === null ? "text.disabled" : backendOnline ? "success.main" : "error.main";
  const statusLabel =
    backendOnline === null ? "Checking API..." : backendOnline ? "API Online" : "API Offline";

  return (
    <Box>
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        <Container maxWidth="xl">
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 1 }}>
              PUBG INSIGHT
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: statusColor }} />
              <Typography variant="caption" color="text.secondary">
                {statusLabel}
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <PlayerSearch />
      </Container>
    </Box>
  );
}

export default App;
