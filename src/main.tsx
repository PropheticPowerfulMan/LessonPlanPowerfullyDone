import React from "react";
import ReactDOM from "react-dom/client";
import { ToastProvider } from "./components/Toast";
import { AppProvider } from "./contexts/AppContext";
import "./index.css";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AppProvider>
  </React.StrictMode>
);
