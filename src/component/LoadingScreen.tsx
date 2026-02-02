function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      {/* Main loader */}
      <div
        style={{
          width: "120px",
          height: "120px",
          border: "8px solid rgba(0, 255, 136, 0.1)",
          borderTop: "8px solid #00ff88",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "30px",
        }}
      />

      {/* Title */}
      <h1
        style={{
          color: "#00ff88",
          fontSize: "32px",
          fontFamily: "Arial, sans-serif",
          fontWeight: "bold",
          margin: "0 0 15px 0",
          textShadow: "0 0 20px rgba(0, 255, 136, 0.5)",
        }}
      >
        🏢 Smart Office
      </h1>

      {/* Loading text */}
      <p
        style={{
          color: "#ffffff",
          fontSize: "16px",
          fontFamily: "Arial, sans-serif",
          margin: "0 0 10px 0",
          opacity: 0.8,
        }}
      >
        Loading 3D Environment...
      </p>

      {/* Progress dots */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            background: "#00ff88",
            borderRadius: "50%",
            animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: "0s",
          }}
        />
        <div
          style={{
            width: "12px",
            height: "12px",
            background: "#00ff88",
            borderRadius: "50%",
            animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: "0.3s",
          }}
        />
        <div
          style={{
            width: "12px",
            height: "12px",
            background: "#00ff88",
            borderRadius: "50%",
            animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: "0.6s",
          }}
        />
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

export default LoadingScreen;
