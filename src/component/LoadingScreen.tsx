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
  // useEffect(() => {
  //   if ((hasError || isTimeout) && onRetry) {
  //     setCountdown(autoRetrySeconds);
  //     const interval = setInterval(() => {
  //       setCountdown((prev) => {
  //         if (prev <= 1) {
  //           clearInterval(interval);
  //           onRetry();
  //           return 0;
  //         }
  //         return prev - 1;
  //       });
  //     }, 1000);
  //     return () => clearInterval(interval);
  //   }
  // }, [hasError, isTimeout, onRetry, autoRetrySeconds]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        // Uses project background color with a subtle gradient variant
        background: "linear-gradient(135deg, #1a1a1a 0%, #242424 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
        padding: "clamp(1rem, 5vw, 3rem)",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Logo/Icon */}
      <div
        style={{
          fontSize: "clamp(3rem, 15vw, 5rem)",
          marginBottom: "clamp(1rem, 3vw, 2rem)",
          animation:
            hasError || isTimeout ? "none" : "pulse 2s ease-in-out infinite",
          lineHeight: 1,
        }}
      >
        {hasError || isTimeout ? "⚠️" : "🏢"}
      </div>

      {/* Title */}
      <h1
        style={{
          // Error: red tone / Normal: project accent #646cff
          color: hasError || isTimeout ? "#ff6b6b" : "#646cff",
          fontSize: "clamp(1.5rem, 5vw, 2rem)",
          fontWeight: "bold",
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

      {/* Message */}
      <p
        style={{
          // Project text color
          color: "rgba(255, 255, 255, 0.87)",
          fontSize: "clamp(0.875rem, 3vw, 1rem)",
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

      {/* Auto-reload countdown */}
      {(hasError || isTimeout) && (
        <div
          style={{
            color: "#646cff",
            fontSize: "clamp(1rem, 3.5vw, 1.125rem)",
            fontWeight: "bold",
            marginBottom: "clamp(1rem, 3vw, 1.5rem)",
            textAlign: "center",
            padding: "0 1rem",
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
            padding: "clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 5vw, 2.5rem)",
            fontSize: "clamp(0.875rem, 3vw, 1.125rem)",
            fontWeight: "500",
            fontFamily: "inherit",
            // Project button colors
            color: "rgba(255, 255, 255, 0.87)",
            background: "#1a1a1a",
            border: "1px solid #646cff",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "border-color 0.25s, box-shadow 0.25s",
            boxShadow: "0 4px 15px rgba(100, 108, 255, 0.2)",
            minWidth: "min(200px, 80%)",
            maxWidth: "300px",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#535bf2";
            e.currentTarget.style.boxShadow =
              "0 6px 20px rgba(100, 108, 255, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#646cff";
            e.currentTarget.style.boxShadow =
              "0 4px 15px rgba(100, 108, 255, 0.2)";
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
            width: "clamp(3rem, 10vw, 4rem)",
            height: "clamp(3rem, 10vw, 4rem)",
            // Spinner uses project accent color
            border: "clamp(4px, 1vw, 6px) solid rgba(100, 108, 255, 0.15)",
            borderTop: "clamp(4px, 1vw, 6px) solid #646cff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      )}

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

          @media (max-height: 500px) {
            body {
              overflow: auto;
            }
          }

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
