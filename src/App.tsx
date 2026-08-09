import { useEffect, useState } from "react";
import api from "./api/axios";

function App() {
  const [message, setMessage] = useState("Connecting...");

  useEffect(() => {
    api
      .get("/health")
      .then((res) => {
        setMessage(res.data.message);
      })
      .catch(() => {
        setMessage("Backend Not Connected");
      });
  }, []);

  return (
    <div style={{ padding: 50 }}>
      <h1>PUBG Insight</h1>
      <h2>{message}</h2>
    </div>
  );
}

export default App;
