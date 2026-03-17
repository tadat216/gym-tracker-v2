import { useEffect, useState } from "react";
import { api } from "./lib/axios";

function App() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    api
      .get("/health")
      .then(() => setConnected(true))
      .catch(() => setConnected(false));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-lg font-medium">
        API Status:{" "}
        <span className={connected ? "text-green-600" : "text-red-600"}>
          {connected ? "connected" : "disconnected"}
        </span>
      </p>
    </div>
  );
}

export default App;
