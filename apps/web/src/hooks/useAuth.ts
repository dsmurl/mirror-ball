import { useState, useEffect } from "react";

export type Claims = { email?: string; "cognito:groups"?: string[]; [k: string]: any };

export function useAuth() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<Claims | null>(null);

  useEffect(() => {
    // 1. Check for token in URL hash (just after a login redirect)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idTokenFromUrl = params.get("id_token");

    if (idTokenFromUrl) {
      setToken(idTokenFromUrl);
      localStorage.setItem("id_token", idTokenFromUrl);
      try {
        const payload = JSON.parse(atob(idTokenFromUrl.split(".")[1]));
        setUser(payload);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Failed to parse token from URL", e);
      }
      return;
    }

    // 2. Fallback to localStorage (on page refresh)
    const savedToken = localStorage.getItem("id_token");
    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split(".")[1]));

        // Check if token is expired (JWT exp is in seconds)
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.log("Session expired, clearing token");
          localStorage.removeItem("id_token");
          setToken("");
          setUser(null);
        } else {
          setToken(savedToken);
          setUser(payload);
        }
      } catch (e) {
        console.error("Failed to parse saved token", e);
        localStorage.removeItem("id_token");
      }
    }
  }, []);

  const logout = (logoutUrl: string) => {
    setToken("");
    setUser(null);
    localStorage.removeItem("id_token");
    window.location.href = logoutUrl;
  };

  const isAdmin = user?.["cognito:groups"]?.includes("admin") || false;

  return { token, user, setToken, setUser, logout, isAdmin };
}
