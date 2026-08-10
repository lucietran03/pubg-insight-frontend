import { useEffect, useState } from "react";
import { Container, Typography } from "@mui/material";
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
    <Container sx={{ py: 4 }}>
      <Typography variant="h4">PUBG Insight</Typography>
      <Typography variant="caption" color="text.secondary">
        {backendStatus}
      </Typography>
      <PlayerSearch />
    </Container>
  );
}

export default App;
