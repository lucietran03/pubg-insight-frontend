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
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: 1 }}>
          PUBG INSIGHT
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ justifyContent: "center", alignItems: "center", mt: 0.5 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: statusColor }} />
          <Typography variant="caption" color="text.secondary">
            {statusLabel}
          </Typography>
        </Stack>
      </Box>
      <PlayerSearch />
    </Container>
  );
}

export default App;
