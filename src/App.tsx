import {
  lazy,
  Suspense,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import LoadingScreen from "./component/LoadingScreen";
import ErrorBoundary from "./component/ErrorBoundary";
import DevicePopup, { DeviceType } from "./component/DevicePopup";

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

  // 🆕 Popup state
  const [activeDevice, setActiveDevice] = useState<DeviceType | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const animationFrameRef = useRef<number | null>(null);
  const lastPositionRef = useRef(0);
  const loadingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("🚀 App starting...");
    console.log("🔍 Device:", { isIOS: isIOS(), isSafari: isSafari() });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadTimePassed(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading && !hasError) {
      loadingTimeoutRef.current = window.setTimeout(() => {
        console.error("❌ Loading timeout (30s)");
        setIsTimeout(true);
      }, 30000);
    }
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [isLoading, hasError]);

  const handleLoaded = () => {
    console.log("✅ handleLoaded called");
    if (minLoadTimePassed) {
      setIsLoading(false);
      setHasError(false);
      setIsTimeout(false);
      setRetryCount(0);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    } else {
      const checkInterval = setInterval(() => {
        if (minLoadTimePassed) {
          setIsLoading(false);
          setHasError(false);
          setIsTimeout(false);
          setRetryCount(0);
          clearInterval(checkInterval);
          if (loadingTimeoutRef.current)
            clearTimeout(loadingTimeoutRef.current);
        }
      }, 100);
    }
  };

  const handleError = () => {
    console.error("❌ handleError called");
    setHasError(true);
    setIsLoading(true);
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
  };

  const handleRetry = () => {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      setRetryCount((prev) => prev + 1);
    } else {
      setRetryCount(0);
    }
    window.location.reload();
  };

  const handleLightsOn = () => {
    if (lightsBrightness === 0) {
      setLightsBrightness(
        lastBrightnessRef.current > 0 ? lastBrightnessRef.current : 100,
      );
    }
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
          const newPos = prev + speed;
          if (newPos >= 100) {
            setCurtainMoving("stopped");
            return 100;
          }
          return newPos;
        } else if (curtainMoving === "down") {
          const newPos = prev - speed;
          if (newPos <= 0) {
            setCurtainMoving("stopped");
            return 0;
          }
          return newPos;
        }
        return prev;
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
    if (Math.abs(curtainPosition - lastPositionRef.current) > 0.01) {
      lastPositionRef.current = curtainPosition;
    }
  }, [curtainPosition]);

  // 🆕 Handle device click from the 3D scene
  const handleDeviceClick = useCallback(
    (device: DeviceType, screenPos: { x: number; y: number }) => {
      // Toggle off if same device clicked again
      if (activeDevice === device) {
        setActiveDevice(null);
        return;
      }
      setActiveDevice(device);
      setPopupPosition(screenPos);
    },
    [activeDevice],
  );

  // 🆕 Close popup
  const handleClosePopup = useCallback(() => {
    setActiveDevice(null);
  }, []);

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
            console.log("🎨 Canvas created successfully");
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
                onDeviceClick={handleDeviceClick} // 🆕
              />
            </Suspense>
          </ErrorBoundary>
        </Canvas>

        {/* 🆕 Floating device control popup */}
        <DevicePopup
          device={activeDevice}
          position={popupPosition}
          onClose={handleClosePopup}
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
    </div>
  );
}

export default App;
