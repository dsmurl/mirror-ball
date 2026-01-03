interface UploaderProps {
  onUpload: (title: string, file: File) => Promise<void>;
  isUploading: boolean;
  status: string;
}

import { useState } from "react";

export function Uploader({ onUpload, isUploading, status }: UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;
    await onUpload(title, file);
    setFile(null);
    setTitle("");
  };

  return (
    <section style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8 }}>
      <h2>Upload Image</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: 4 }}>Title:</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter image title"
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="file"
            accept="image/*,.pdf"
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <button
          type="submit"
          disabled={isUploading || !file || !title}
          style={{
            padding: "10px 20px",
            backgroundColor: isUploading || !file || !title ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: isUploading || !file || !title ? "not-allowed" : "pointer",
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
  );
}
