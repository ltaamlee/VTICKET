import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { SystemSettingsProvider } from "./contexts/SystemSettingsContext.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <SystemSettingsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SystemSettingsProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);