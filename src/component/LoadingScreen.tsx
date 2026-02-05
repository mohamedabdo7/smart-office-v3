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
        padding: "clamp(1rem, 5vw, 3rem)",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Logo/Icon - Responsive size */}
      <div
        style={{
          fontSize: "clamp(3rem, 15vw, 5rem)", // 48px - 80px
          marginBottom: "clamp(1rem, 3vw, 2rem)",
          animation:
            hasError || isTimeout ? "none" : "pulse 2s ease-in-out infinite",
          lineHeight: 1,
        }}
      >
        {hasError || isTimeout ? "⚠️" : "🏢"}
      </div>

      {/* Title - Responsive font size */}
      <h1
        style={{
          color: hasError || isTimeout ? "#ff6b6b" : "#00ff88",
          fontSize: "clamp(1.5rem, 5vw, 2rem)", // 24px - 32px
          fontWeight: "bold",
          marginBottom: "clamp(0.75rem, 2vw, 1rem)",
          textAlign: "center",
          lineHeight: 1.2,
          padding: "0 1rem",
          maxWidth: "100%",
          wordBreak: "break-word",
          margin: "0 0 clamp(0.75rem, 2vw, 1rem) 0",
        }}
      >
        {hasError
          ? "Loading Failed"
          : isTimeout
            ? "Loading Timeout"
            : "Loading Office..."}
      </h1>

      {/* Message - Responsive font and spacing */}
      <p
        style={{
          color: "#aaa",
          fontSize: "clamp(0.875rem, 3vw, 1rem)", // 14px - 16px
          marginBottom: "clamp(1rem, 3vw, 1.5rem)",
          textAlign: "center",
          maxWidth: "min(90%, 400px)",
          padding: "0 1rem",
          lineHeight: 1.5,
          margin: "0 0 clamp(1rem, 3vw, 1.5rem) 0",
        }}
      >
        {hasError
          ? "Failed to load 3D models. Please check your internet connection."
          : isTimeout
            ? "Loading is taking longer than expected."
            : "Please wait while we prepare your virtual office"}
      </p>

      {/* Auto-reload countdown - Responsive */}
      {(hasError || isTimeout) && (
        <div
          style={{
            color: "#00ff88",
            fontSize: "clamp(1rem, 3.5vw, 1.125rem)", // 16px - 18px
            fontWeight: "bold",
            marginBottom: "clamp(1rem, 3vw, 1.5rem)",
            textAlign: "center",
            padding: "0 1rem",
          }}
        >
          Retrying in {countdown} second{countdown !== 1 ? "s" : ""}...
        </div>
      )}

      {/* Retry Button or Loading Spinner - Responsive */}
      {hasError || isTimeout ? (
        <button
          onClick={onRetry}
          style={{
            padding: "clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 5vw, 2.5rem)",
            fontSize: "clamp(0.875rem, 3vw, 1.125rem)", // 14px - 18px
            fontWeight: "bold",
            color: "#000",
            background: "#00ff88",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.3s",
            boxShadow: "0 4px 15px rgba(0, 255, 136, 0.3)",
            minWidth: "min(200px, 80%)",
            maxWidth: "300px",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
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
          onTouchStart={(e) => {
            e.currentTarget.style.transform = "scale(0.95)";
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          🔄 Retry Now
        </button>
      ) : (
        <div
          style={{
            width: "clamp(3rem, 10vw, 4rem)", // 48px - 64px
            height: "clamp(3rem, 10vw, 4rem)", // 48px - 64px
            border: "clamp(4px, 1vw, 6px) solid rgba(0, 255, 136, 0.1)",
            borderTop: "clamp(4px, 1vw, 6px) solid #00ff88",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      )}

      {/* CSS Animations - Enhanced for mobile */}
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

          /* Ensure smooth scrolling if content overflows on very small screens */
          @media (max-height: 500px) {
            body {
              overflow: auto;
            }
          }

          /* Reduce animation on devices that prefer reduced motion */
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default LoadingScreen;
