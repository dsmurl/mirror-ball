interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <>
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-20px); }
            10% { opacity: 1; transform: translateY(0); }
            90% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-20px); }
          }
        `}
      </style>
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          backgroundColor: "#28a745",
          color: "white",
          padding: "12px 24px",
          borderRadius: 4,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 1000,
          animation: "fadeInOut 1s ease-in-out forwards",
        }}
      >
        {message}
      </div>
    </>
  );
}
