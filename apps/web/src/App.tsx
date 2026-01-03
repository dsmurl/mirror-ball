import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { Gallery } from "./components/Gallery";
import { Uploader } from "./components/Uploader";
import { Toast } from "./components/Toast";
import { DebugEnv } from "./components/DebugEnv";

export default function App() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<"gallery" | "upload">("gallery");
  const [images, setImages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  useEffect(() => {
    if (token && view === "gallery") {
      fetchImages();
    }
  }, [token, view]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function fetchImages() {
    setIsLoadingImages(true);
    try {
      const res = await fetch(`${API_BASE}/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingImages(false);
    }
  }

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

  async function handleUpload(title: string, file: File) {
    setIsUploading(true);
    setStatus("Reading file dimensions...");

    let dimensions = "";
    if (file.type.startsWith("image/")) {
      dimensions = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(`${img.width}x${img.height}`);
        img.onerror = () => resolve("");
        img.src = URL.createObjectURL(file);
      });
    }

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
          title: title,
          dimensions: dimensions || undefined,
          fileSize: file.size,
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
      // Switch to gallery to see the new image
      setTimeout(() => {
        setView("gallery");
        setStatus("");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setToast("Link copied to clipboard!");
  };

  return (
    <div
      style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 800, margin: "0 auto" }}
    >
      <Toast message={toast} />

      <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />

      {user ? (
        <>
          <Navigation view={view} onViewChange={setView} />

          {view === "gallery" ? (
            <Gallery
              images={images}
              isLoading={isLoadingImages}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onCopyLink={handleCopyLink}
            />
          ) : (
            <Uploader onUpload={handleUpload} isUploading={isUploading} status={status} />
          )}

          <hr style={{ margin: "24px 0" }} />
          {/*<DebugEnv />*/}
        </>
      ) : (
        <div style={{ textAlign: "center", marginTop: 100, color: "#666" }}>
          <p>Please login to access the image gallery and upload features.</p>
        </div>
      )}
    </div>
  );
}
