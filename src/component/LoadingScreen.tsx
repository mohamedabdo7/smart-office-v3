import { useEffect, useState } from "react";

interface LoadingScreenProps {
  hasError?: boolean;
  isTimeout?: boolean;
  onRetry?: () => void;
  autoRetrySeconds?: number;
}

function LoadingScreen({
  hasError = false,
  isTimeout = false,
  onRetry,
  autoRetrySeconds = 5,
}: LoadingScreenProps) {
  const [countdown, setCountdown] = useState(autoRetrySeconds);

  // Auto-reload countdown
  useEffect(() => {
    if ((hasError || isTimeout) && onRetry) {
      setCountdown(autoRetrySeconds);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onRetry(); // Auto reload
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [hasError, isTimeout, onRetry, autoRetrySeconds]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Logo/Icon */}
      <div
        style={{
          fontSize: "80px",
          marginBottom: "30px",
          animation:
            hasError || isTimeout ? "none" : "pulse 2s ease-in-out infinite",
        }}
      >
        {hasError || isTimeout ? "⚠️" : "🏢"}
      </div>

      {/* Title */}
      <h1
        style={{
          color: hasError || isTimeout ? "#ff6b6b" : "#00ff88",
          fontSize: "32px",
          fontWeight: "bold",
          marginBottom: "15px",
          textAlign: "center",
        }}
      >
        {hasError
          ? "Loading Failed"
          : isTimeout
            ? "Loading Timeout"
            : "Loading Office..."}
      </h1>

      {/* Message */}
      <p
        style={{
          color: "#aaa",
          fontSize: "16px",
          marginBottom: "20px",
          textAlign: "center",
          maxWidth: "400px",
          padding: "0 20px",
        }}
      >
        {hasError
          ? "Failed to load 3D models. Please check your internet connection."
          : isTimeout
            ? "Loading is taking longer than expected."
            : "Please wait while we prepare your virtual office"}
      </p>

      {/* Auto-reload countdown */}
      {(hasError || isTimeout) && (
        <div
          style={{
            color: "#00ff88",
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          Retrying in {countdown} second{countdown !== 1 ? "s" : ""}...
        </div>
      )}

      {/* Retry Button or Loading Spinner */}
      {hasError || isTimeout ? (
        <button
          onClick={onRetry}
          style={{
            padding: "15px 40px",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#000",
            background: "#00ff88",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.3s",
            boxShadow: "0 4px 15px rgba(0, 255, 136, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow =
              "0 6px 20px rgba(0, 255, 136, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow =
              "0 4px 15px rgba(0, 255, 136, 0.3)";
          }}
        >
          🔄 Retry Now
        </button>
      ) : (
        <div
          style={{
            width: "60px",
            height: "60px",
            border: "6px solid rgba(0, 255, 136, 0.1)",
            borderTop: "6px solid #00ff88",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      )}

      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
        `}
      </style>
    </div>
  );
}

export default LoadingScreen;
