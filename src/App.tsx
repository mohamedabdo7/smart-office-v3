import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import ControlPanel from "./component/ControlPanel";
import LoadingScreen from "./component/LoadingScreen";
import ErrorBoundary from "./component/ErrorBoundary";
import { DEVICE_LABELS } from "./component/OfficeModel";

const Scene = lazy(() => import("./component/Scene"));

const MAX_RETRY_ATTEMPTS = 3;
const AUTO_RETRY_DELAY = 5;

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isSafari = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [minLoadTimePassed, setMinLoadTimePassed] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const [lightsBrightness, setLightsBrightness] = useState(100);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [meetingOn, setMeetingOn] = useState(false);

  const lastBrightnessRef = useRef(100);

  const [curtainPosition, setCurtainPosition] = useState(0);
  const [curtainMoving, setCurtainMoving] = useState<"up" | "down" | "stopped">(
    "stopped",
  );

  const [tooltip, setTooltip] = useState<{ label: string } | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const lastPositionRef = useRef(0);
  const loadingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("🚀 App starting...", { isIOS: isIOS(), isSafari: isSafari() });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMinLoadTimePassed(true), 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading && !hasError) {
      loadingTimeoutRef.current = window.setTimeout(
        () => setIsTimeout(true),
        30000,
      );
    }
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [isLoading, hasError]);

  const handleLoaded = () => {
    if (minLoadTimePassed) {
      setIsLoading(false);
      setHasError(false);
      setIsTimeout(false);
      setRetryCount(0);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    } else {
      const iv = setInterval(() => {
        if (minLoadTimePassed) {
          setIsLoading(false);
          setHasError(false);
          setIsTimeout(false);
          setRetryCount(0);
          clearInterval(iv);
          if (loadingTimeoutRef.current)
            clearTimeout(loadingTimeoutRef.current);
        }
      }, 100);
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(true);
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
  };

  const handleRetry = () => {
    if (retryCount < MAX_RETRY_ATTEMPTS) setRetryCount((p) => p + 1);
    else setRetryCount(0);
    window.location.reload();
  };

  // ── Lights ──────────────────────────────────────────────
  const handleLightsOn = () => {
    if (lightsBrightness === 0)
      setLightsBrightness(
        lastBrightnessRef.current > 0 ? lastBrightnessRef.current : 100,
      );
  };
  const handleLightsOff = () => {
    if (lightsBrightness > 0) {
      lastBrightnessRef.current = lightsBrightness;
      setLightsBrightness(0);
    }
  };
  useEffect(() => {
    if (lightsBrightness > 0) lastBrightnessRef.current = lightsBrightness;
  }, [lightsBrightness]);

  const handleLightClick = () => {
    if (lightsBrightness > 0) {
      lastBrightnessRef.current = lightsBrightness;
      setLightsBrightness(0);
    } else {
      setLightsBrightness(
        lastBrightnessRef.current > 0 ? lastBrightnessRef.current : 100,
      );
    }
  };

  const handlePrivacyClick = () => setPrivacyMode((p) => !p);
  const handleMeetingClick = () => setMeetingOn((p) => !p);

  // 🪟 Curtain click — واقفة ↓ → فوق | بتتحرك → وقف | فوق → تنزل
  const handleCurtainClick = () => {
    if (curtainMoving !== "stopped") {
      setCurtainMoving("stopped");
    } else if (curtainPosition < 100) {
      setCurtainMoving("up");
    } else {
      setCurtainMoving("down");
    }
  };

  // ── Curtain animation ────────────────────────────────────
  useEffect(() => {
    if (curtainMoving === "stopped") {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }
    const speed = 0.0833;
    const animate = () => {
      setCurtainPosition((prev) => {
        if (curtainMoving === "up") {
          const n = prev + speed;
          if (n >= 100) {
            setCurtainMoving("stopped");
            return 100;
          }
          return n;
        } else {
          const n = prev - speed;
          if (n <= 0) {
            setCurtainMoving("stopped");
            return 0;
          }
          return n;
        }
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [curtainMoving]);

  const handleCurtainUp = () => {
    if (curtainPosition < 100) setCurtainMoving("up");
  };
  const handleCurtainDown = () => {
    if (curtainPosition > 0) setCurtainMoving("down");
  };
  const handleCurtainStop = () => {
    if (curtainMoving !== "stopped") setCurtainMoving("stopped");
  };

  useEffect(() => {
    if (Math.abs(curtainPosition - lastPositionRef.current) > 0.01)
      lastPositionRef.current = curtainPosition;
  }, [curtainPosition]);

  // ── Tooltip ──────────────────────────────────────────────
  const handleHoverEnter = (deviceType: string) => {
    const label = DEVICE_LABELS[deviceType];
    if (label) setTooltip({ label });
  };
  const handleHoverLeave = () => setTooltip(null);

  // ── Curtain at top label ─────────────────────────────────
  const curtainAtTop = curtainPosition >= 99;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      {isLoading && (
        <LoadingScreen
          hasError={hasError}
          isTimeout={isTimeout}
          onRetry={handleRetry}
          autoRetrySeconds={AUTO_RETRY_DELAY}
        />
      )}

      <div
        style={{
          width: "100%",
          height: "100%",
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.5s",
        }}
      >
        <div style={{ display: "none" }}>
          <ControlPanel
            lightsBrightness={lightsBrightness}
            setLightsBrightness={setLightsBrightness}
            onLightsOn={handleLightsOn}
            onLightsOff={handleLightsOff}
            privacyMode={privacyMode}
            setPrivacyMode={setPrivacyMode}
            meetingOn={meetingOn}
            setMeetingOn={setMeetingOn}
            curtainPosition={curtainPosition}
            onCurtainUp={handleCurtainUp}
            onCurtainDown={handleCurtainDown}
            onCurtainStop={handleCurtainStop}
            curtainMoving={curtainMoving}
          />
        </div>

        <Canvas
          shadows
          camera={{ position: [0, 1.6, 5], fov: 75, near: 0.1, far: 1000 }}
          style={{ width: "100%", height: "100%", display: "block" }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
        >
          <color attach="background" args={["#87ceeb"]} />
          <ErrorBoundary onError={handleError}>
            <Suspense fallback={null}>
              <Scene
                lightsBrightness={lightsBrightness}
                privacyMode={privacyMode}
                meetingOn={meetingOn}
                curtainPosition={curtainPosition}
                onLoaded={handleLoaded}
                onError={handleError}
                onLightClick={handleLightClick}
                onPrivacyClick={handlePrivacyClick}
                onMeetingClick={handleMeetingClick}
                onCurtainClick={handleCurtainClick}
                onHoverEnter={handleHoverEnter}
                onHoverLeave={handleHoverLeave}
              />
            </Suspense>
          </ErrorBoundary>
        </Canvas>

        {/* 🆕 Tooltip */}
        {tooltip && (
          <div
            style={{
              position: "fixed",
              left: "50%",
              bottom: "40px",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.82)",
              color: "#fff",
              padding: "10px 22px",
              borderRadius: "10px",
              fontSize: "15px",
              fontFamily: "Arial, sans-serif",
              pointerEvents: "none",
              zIndex: 9000,
              border: "1.5px solid #00ff88",
              boxShadow: "0 4px 18px rgba(0,255,136,0.25)",
              whiteSpace: "nowrap",
            }}
          >
            {tooltip.label}
          </div>
        )}

        {/* 🆕 Curtain fallback button — بيظهر بس لما الستارة فوق */}
        {!isLoading && curtainAtTop && (
          <button
            onClick={handleCurtainClick}
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "rgba(0,0,0,0.82)",
              color: "#fff",
              border: "1.5px solid #00ff88",
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "14px",
              fontFamily: "Arial, sans-serif",
              cursor: "pointer",
              zIndex: 9000,
              boxShadow: "0 4px 18px rgba(0,255,136,0.25)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,255,136,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.82)";
            }}
          >
            🪟 نزّل الستارة
          </button>
        )}

        {/* 🆕 Curtain moving indicator */}
        {!isLoading && curtainMoving !== "stopped" && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "rgba(0,0,0,0.82)",
              color: "#00ff88",
              border: "1.5px solid #00ff88",
              borderRadius: "10px",
              padding: "10px 18px",
              fontSize: "14px",
              fontFamily: "Arial, sans-serif",
              zIndex: 9000,
              pointerEvents: "none",
            }}
          >
            {curtainMoving === "up"
              ? "⬆️ الستارة بتطلع..."
              : "⬇️ الستارة بتنزل..."}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
