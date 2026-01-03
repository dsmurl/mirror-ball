interface NavigationProps {
  view: "gallery" | "upload";
  onViewChange: (view: "gallery" | "upload") => void;
}

export function Navigation({ view, onViewChange }: NavigationProps) {
  return (
    <nav style={{ marginBottom: 24, display: "flex", gap: 16 }}>
      <button
        onClick={() => onViewChange("gallery")}
        style={{
          background: "none",
          border: "none",
          borderBottom: view === "gallery" ? "2px solid #007bff" : "2px solid transparent",
          color: view === "gallery" ? "#007bff" : "#666",
          padding: "8px 0",
          cursor: "pointer",
          fontWeight: view === "gallery" ? "bold" : "normal",
        }}
      >
        Images
      </button>
      <button
        onClick={() => onViewChange("upload")}
        style={{
          background: "none",
          border: "none",
          borderBottom: view === "upload" ? "2px solid #007bff" : "2px solid transparent",
          color: view === "upload" ? "#007bff" : "#666",
          padding: "8px 0",
          cursor: "pointer",
          fontWeight: view === "upload" ? "bold" : "normal",
        }}
      >
        Upload New
      </button>
    </nav>
  );
}
