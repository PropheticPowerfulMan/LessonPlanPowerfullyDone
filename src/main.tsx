import React from "react";
import ReactDOM from "react-dom/client";
import { ToastProvider } from "./components/Toast";
import { AppProvider } from "./contexts/AppContext";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";
import { App } from "./App";
import { applyFinalProductionReset } from "./services/finalResetService";
import { registerPwaServiceWorker } from "./services/pwaService";
import { normalizeRecoveryUrlBeforeRouter } from "./services/urlRecoveryService";

normalizeRecoveryUrlBeforeRouter();
applyFinalProductionReset();
registerPwaServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </AppProvider>
  </React.StrictMode>
);
