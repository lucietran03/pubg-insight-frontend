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
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", py: { xs: 1.5, md: 2 }, flexWrap: "wrap", gap: 1 }}>
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
      <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
        <PlayerSearch />
      </Container>
      <Box sx={{ borderTop: "1px solid", borderColor: "divider", mt: 2 }}>
        <Container maxWidth="xl">
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", py: 2 }}>
            Tran Dong Nghi · s3914633 · RMIT Vietnam University
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default App;
