import { useConfig } from "../hooks/useConfig";

export function DebugEnv() {
  const { API_BASE, CLIENT_ID, COGNITO_DOMAIN } = useConfig();

  return (
    <details>
      <summary style={{ cursor: "pointer", color: "#666" }}>Debug Env</summary>
      <ul style={{ fontSize: "0.8em", color: "#666", marginTop: 12 }}>
        <li>API: {API_BASE || "(unset)"}</li>
        <li>UserPool Client: {CLIENT_ID || "(unset)"}</li>
        <li>Cognito Domain: {COGNITO_DOMAIN || "(unset)"}</li>
      </ul>
    </details>
  );
}
