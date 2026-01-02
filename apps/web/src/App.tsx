import { useState, useEffect } from "react";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [devName, setDevName] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
  const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN ?? "";
  const CLIENT_ID = import.meta.env.VITE_USER_POOL_CLIENT_ID ?? "";
  const REDIRECT_URI = window.location.origin + "/";

  useEffect(() => {
    // Check for tokens in the URL hash (Implicit flow for simplicity in this demo)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get("id_token");

    if (idToken) {
      setToken(idToken);
      // Basic decode of JWT for UI display
      try {
        const payload = JSON.parse(atob(idToken.split(".")[1]));
        setUser(payload);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Failed to parse token", e);
      }
    }
  }, []);

  function handleLogin() {
    const loginUrl = `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=token&scope=email+openid+profile&redirect_uri=${encodeURIComponent(
      REDIRECT_URI,
    )}`;
    window.location.href = loginUrl;
  }

  function handleLogout() {
    setToken("");
    setUser(null);
    const logoutUrl = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(
      REDIRECT_URI,
    )}`;
    window.location.href = logoutUrl;
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !devName || !token) {
      alert("Please provide file, dev name, and auth token");
      return;
    }

    setIsUploading(true);
    setStatus("Getting pre-signed URL...");

    try {
      // 1. Get pre-signed URL
      const presignRes = await fetch(`${API_BASE}/presign-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentType: file.type,
          fileName: file.name,
          devName: devName,
        }),
      });

      if (!presignRes.ok) throw new Error(await presignRes.text());
      const { uploadUrl, imageId } = await presignRes.json();

      // 2. Upload to S3
      setStatus("Uploading to S3...");
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!s3Res.ok) throw new Error("S3 upload failed");

      // 3. Confirm upload
      setStatus("Confirming with API...");
      const confirmRes = await fetch(`${API_BASE}/confirm-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageId }),
      });

      if (!confirmRes.ok) throw new Error("Confirmation failed");

      setStatus("Upload successful!");
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div
      style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 600, margin: "0 auto" }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #eee",
          marginBottom: 24,
          paddingBottom: 12,
        }}
      >
        <h1 style={{ margin: 0 }}>mirror-ball</h1>
        <div>
          {user ? (
            <div style={{ textAlign: "right" }}>
              <span style={{ marginRight: 12, fontSize: "0.9em" }}>
                Logged in as <strong>{user.email || user["cognito:username"]}</strong>
              </span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button onClick={handleLogin} style={{ padding: "8px 16px" }}>
              Login
            </button>
          )}
        </div>
      </header>

      <p>Simple image upload/list site with role-based access.</p>

      <section style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8 }}>
        <h2>Upload Image</h2>
        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: "bold" }}>Dev Name:</label>
            <input
              type="text"
              value={devName}
              onChange={(e) => setDevName(e.target.value)}
              placeholder="e.g. John Doe"
              style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: "bold" }}>Auth Token (JWT):</label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Login to get token or paste manually"
              style={{ width: "100%", height: 60, padding: 8, boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <button
            type="submit"
            disabled={isUploading || !file || !token}
            style={{
              padding: "10px 20px",
              backgroundColor: isUploading || !file || !token ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: isUploading || !file || !token ? "not-allowed" : "pointer",
            }}
          >
            {isUploading ? "Uploading..." : "Upload Image"}
          </button>
        </form>

        {status && (
          <p
            style={{
              marginTop: 12,
              padding: 8,
              background: status.startsWith("Error") ? "#fee" : "#efe",
              borderRadius: 4,
              border: status.startsWith("Error") ? "1px solid #fcc" : "1px solid #cfc",
            }}
          >
            {status}
          </p>
        )}
      </section>

      <hr style={{ margin: "24px 0" }} />

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
    </div>
  );
}
