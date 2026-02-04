import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import ControlPanel from "./component/ControlPanel";
import LoadingScreen from "./component/LoadingScreen";

const Scene = lazy(() => import("./component/Scene"));

const MAX_RETRY_ATTEMPTS = 3; // Maximum auto-retry attempts
const AUTO_RETRY_DELAY = 5; // seconds

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

  const animationFrameRef = useRef<number | null>(null);
  const lastPositionRef = useRef(0);
  const loadingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadTimePassed(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading && !hasError) {
      loadingTimeoutRef.current = window.setTimeout(() => {
        setIsTimeout(true);
      }, 30000);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading, hasError]);

  const handleLoaded = () => {
    if (minLoadTimePassed) {
      setIsLoading(false);
      setHasError(false);
      setIsTimeout(false);
      setRetryCount(0); // Reset retry count on success
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    } else {
      const checkInterval = setInterval(() => {
        if (minLoadTimePassed) {
          setIsLoading(false);
          setHasError(false);
          setIsTimeout(false);
          setRetryCount(0);
          clearInterval(checkInterval);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
        }
      }, 100);
    }
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(true);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  };

  const handleRetry = () => {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      setRetryCount((prev) => prev + 1);
      window.location.reload();
    } else {
      // After max attempts, show permanent error with manual retry only
      setRetryCount(0);
      window.location.reload();
    }
  };

  const handleLightsOn = () => {
    if (lightsBrightness === 0) {
      const targetBrightness =
        lastBrightnessRef.current > 0 ? lastBrightnessRef.current : 100;
      setLightsBrightness(targetBrightness);
    }
  };

  const handleLightsOff = () => {
    if (lightsBrightness > 0) {
      lastBrightnessRef.current = lightsBrightness;
      setLightsBrightness(0);
    }
  };

  useEffect(() => {
    if (lightsBrightness > 0) {
      lastBrightnessRef.current = lightsBrightness;
    }
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
    if (curtainPosition >= 100) {
      return;
    }
    setCurtainMoving("up");
  };

  const handleCurtainDown = () => {
    if (curtainPosition <= 0) {
      return;
    }
    setCurtainMoving("down");
  };

  const handleCurtainStop = () => {
    if (curtainMoving === "stopped") {
      return;
    }
    setCurtainMoving("stopped");
  };

  useEffect(() => {
    if (Math.abs(curtainPosition - lastPositionRef.current) > 0.01) {
      lastPositionRef.current = curtainPosition;
    }
  }, [curtainPosition]);

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
          <Suspense fallback={null}>
            <Scene
              lightsBrightness={lightsBrightness}
              privacyMode={privacyMode}
              meetingOn={meetingOn}
              curtainPosition={curtainPosition}
              onLoaded={handleLoaded}
              onError={handleError}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

export default App;
