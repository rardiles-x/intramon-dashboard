import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import LocalAuthGate from "./features/auth/LocalAuthGate";
import "./index.css";
import "./features/auth/localAuth.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocalAuthGate>
      <App />
    </LocalAuthGate>
  </StrictMode>,
);
