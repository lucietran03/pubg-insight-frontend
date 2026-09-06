import { useEffect, useState } from "react";
import { Box, Container, Typography } from "@mui/material";
import api from "./api/axios";
import PlayerSearch from "./components/PlayerSearch";

function App() {
  const [backendStatus, setBackendStatus] = useState("Connecting...");

  useEffect(() => {
    api
      .get("/health")
      .then((res) => {
        setBackendStatus(res.data.message);
      })
      .catch(() => {
        setBackendStatus("Backend Not Connected");
      });
  }, []);

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ textAlign: "center", mb: 1 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: 1 }}>
          PUBG INSIGHT
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {backendStatus}
        </Typography>
      </Box>
      <PlayerSearch />
    </Container>
  );
}

export default App;
