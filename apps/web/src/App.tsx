import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./hooks/useAuth";
import { useImages } from "./hooks/useImages";
import { useToast } from "./hooks/useToast";
import { useConfig } from "./hooks/useConfig";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { Gallery } from "./components/Gallery";
import { Uploader } from "./components/Uploader";
import { AdminPanel } from "./components/AdminPanel";
import { Toast } from "./components/Toast";
import { DebugEnv } from "./components/DebugEnv";

export default function App() {
  const queryClient = useQueryClient();
  const { token, user, logout, isAdmin } = useAuth();
  const { toast, showToast } = useToast();
  const { API_BASE, COGNITO_DOMAIN, CLIENT_ID, REDIRECT_URI } = useConfig();

  const { images, isLoading: isLoadingImages } = useImages({ token, apiBase: API_BASE });

  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [view, setView] = useState<"gallery" | "upload" | "admin">("gallery");
  const [searchTerm, setSearchTerm] = useState("");

  function handleLogin() {
    const loginUrl = `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=token&scope=email+openid+profile&redirect_uri=${encodeURIComponent(
      REDIRECT_URI,
    )}`;
    window.location.href = loginUrl;
  }

  function handleLogout() {
    const logoutUrl = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(
      REDIRECT_URI,
    )}`;
    logout(logoutUrl);
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
      // Invalidate images query to refresh the gallery
      await queryClient.invalidateQueries({ queryKey: ["images"] });
      // Switch to the gallery to see the new image
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
    showToast("Link copied to clipboard!");
  };

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: 24,
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <style>
        {`
          html {
            scrollbar-gutter: stable;
          }
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
          }
        `}
      </style>
      <Toast message={toast} />

      <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />

      {user ? (
        <>
          <Navigation view={view} onViewChange={setView} isAdmin={isAdmin} />

          {view === "gallery" ? (
            <Gallery
              images={images}
              isLoading={isLoadingImages}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onCopyLink={handleCopyLink}
            />
          ) : view === "upload" ? (
            <Uploader onUpload={handleUpload} isUploading={isUploading} status={status} />
          ) : (
            <AdminPanel />
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
