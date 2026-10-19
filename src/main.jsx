import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { MarketProvider } from "./context/MarketContext";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";
import "./bootstrap-theme.css";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <MarketProvider>
        <App />
      </MarketProvider>
    </HashRouter>
  </React.StrictMode>,
);
