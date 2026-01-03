export function DebugEnv() {
  return (
    <details>
      <summary style={{ cursor: "pointer", color: "#666" }}>Debug Env</summary>
      <ul style={{ fontSize: "0.8em", color: "#666", marginTop: 12 }}>
        <li>API: {import.meta.env.VITE_API_BASE_URL ?? "(unset)"}</li>
        <li>
          UserPool: {import.meta.env.VITE_USER_POOL_ID ?? "(unset)"} /{" "}
          {import.meta.env.VITE_USER_POOL_CLIENT_ID ?? "(unset)"}
        </li>
        <li>CloudFront: {import.meta.env.VITE_CLOUDFRONT_DOMAIN ?? "(unset)"}</li>
        <li>Cognito Domain: {import.meta.env.VITE_COGNITO_DOMAIN ?? "(unset)"}</li>
      </ul>
    </details>
  );
}
