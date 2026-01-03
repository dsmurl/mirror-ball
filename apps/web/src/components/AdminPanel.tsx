export function AdminPanel() {
  return (
    <section style={{ border: "1px solid #dc3545", padding: 16, borderRadius: 8 }}>
      <h2 style={{ color: "#dc3545" }}>Admin Control Panel</h2>
      <p>
        This panel is only visible to users in the <strong>admin</strong> Cognito group.
      </p>
      <div
        style={{
          marginTop: 20,
          padding: 20,
          backgroundColor: "#f8f9fa",
          borderRadius: 4,
          border: "1px dashed #ccc",
        }}
      >
        <p style={{ color: "#666", textAlign: "center" }}>Admin features placeholder</p>
      </div>
    </section>
  );
}
