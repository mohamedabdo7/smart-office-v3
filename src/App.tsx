import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import ControlPanel from "./component/ControlPanel";
import LoadingScreen from "./component/LoadingScreen";
import ErrorBoundary from "./component/ErrorBoundary";

const Scene = lazy(() => import("./component/Scene"));

const MAX_RETRY_ATTEMPTS = 3;
const AUTO_RETRY_DELAY = 5;

// 📱 Detect WebView environment
const isWebView = (() => {
  const ua = navigator.userAgent;
  return (
    ua.includes("Flutter") ||
    /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua) ||
    ua.includes("wv")
  );
})();

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isIOSWebView = isIOS && isWebView;

console.log("🌐 App Environment:", { isIOS, isWebView, isIOSWebView });

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

  // 📱 WebView-specific: Extended minimum load time
  useEffect(() => {
    const minLoadTime = isIOSWebView ? 2000 : isIOS ? 1500 : 1000;
    console.log(`⏳ Setting min load time: ${minLoadTime}ms`);

    const timer = setTimeout(() => {
      console.log("✅ Min load time passed");
      setMinLoadTimePassed(true);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, []);

  // 📱 WebView-specific: Much longer loading timeout
  useEffect(() => {
    if (isLoading && !hasError) {
      // WebView needs MUCH more time
      const timeout = isIOSWebView ? 90000 : isIOS ? 45000 : 30000;
      console.log(`⏱️ Setting loading timeout: ${timeout / 1000}s`);

      loadingTimeoutRef.current = window.setTimeout(() => {
        console.warn("⏱️ Loading timeout reached");
        setIsTimeout(true);
      }, timeout);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading, hasError]);

  const handleLoaded = () => {
    console.log("📦 Scene loaded, checking min time...");
    if (minLoadTimePassed) {
      console.log("✅ Min time passed, showing scene");
      setIsLoading(false);
      setHasError(false);
      setIsTimeout(false);
      setRetryCount(0);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    } else {
      console.log("⏳ Waiting for min load time...");
      const checkInterval = setInterval(() => {
        if (minLoadTimePassed) {
          console.log("✅ Min time passed (delayed), showing scene");
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
    console.error("❌ Error in scene loading");
    setHasError(true);
    setIsLoading(true);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  };

  const handleRetry = () => {
    console.log("🔄 Retrying...", retryCount);
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      setRetryCount((prev) => prev + 1);
      window.location.reload();
    } else {
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
    if (curtainPosition >= 100) return;
    setCurtainMoving("up");
  };

  const handleCurtainDown = () => {
    if (curtainPosition <= 0) return;
    setCurtainMoving("down");
  };

  const handleCurtainStop = () => {
    if (curtainMoving === "stopped") return;
    setCurtainMoving("stopped");
  };

  useEffect(() => {
    if (Math.abs(curtainPosition - lastPositionRef.current) > 0.01) {
      lastPositionRef.current = curtainPosition;
    }
  }, [curtainPosition]);

  // 📱 Log environment info
  useEffect(() => {
    console.log("📱 Device Info:", {
      isIOSWebView,
      isIOS,
      isWebView,
      userAgent: navigator.userAgent,
      memory: (performance as any).memory,
      devicePixelRatio: window.devicePixelRatio,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    });
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        // 📱 Prevent WebView scroll/zoom
        touchAction: "none",
        userSelect: "none",
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
          shadows={false} // 📱 ALWAYS disable shadows in WebView
          camera={{ position: [0, 1.6, 5], fov: 75, near: 0.1, far: 1000 }}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            // 📱 Allow camera rotation
            touchAction: "none",
          }}
          gl={{
            // 📱 WebView-specific settings
            antialias: false, // Always off in WebView
            alpha: false,
            stencil: false,
            depth: true,
            powerPreference: isIOSWebView ? "low-power" : "default",
            precision: isIOSWebView ? "lowp" : "mediump", // Even lower for WebView
            preserveDrawingBuffer: false,
            // Tone mapping
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          onCreated={({ gl, camera }) => {
            console.log("🎨 Canvas created");

            // 📱 WebView: Limit pixel ratio aggressively
            const pixelRatio = isIOSWebView
              ? Math.min(window.devicePixelRatio, 1.5) // Max 1.5x for WebView
              : isIOS
                ? Math.min(window.devicePixelRatio, 2)
                : window.devicePixelRatio;

            gl.setPixelRatio(pixelRatio);
            console.log(
              `📐 Pixel ratio set to: ${pixelRatio} (device: ${window.devicePixelRatio})`,
            );

            // Disable shadows completely
            gl.shadowMap.enabled = false;

            // 📱 WebView: More aggressive culling
            camera.far = 100; // Reduce far plane
            camera.updateProjectionMatrix();

            console.log("📊 Canvas setup complete");
          }}
          // 📱 WebView: Performance settings
          performance={{
            min: isIOSWebView ? 0.3 : 0.5, // Lower quality threshold
            max: isIOSWebView ? 0.7 : 1.0,
            debounce: 200,
          }}
          dpr={isIOSWebView ? [1, 1.5] : isIOS ? [1, 2] : undefined}
          // 📱 Always render for camera movement (frameloop="always" is default)
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
              />
            </Suspense>
          </ErrorBoundary>
        </Canvas>
      </div>
    </div>
  );
}

export default App;

// import { lazy, Suspense, useState, useEffect, useRef } from "react";
// import { Canvas } from "@react-three/fiber";
// import * as THREE from "three";
// import ControlPanel from "./component/ControlPanel";
// import LoadingScreen from "./component/LoadingScreen";
// import ErrorBoundary from "./component/ErrorBoundary";

// const Scene = lazy(() => import("./component/Scene"));

// const MAX_RETRY_ATTEMPTS = 3; // Maximum auto-retry attempts
// const AUTO_RETRY_DELAY = 5; // seconds

// function App() {
//   const [isLoading, setIsLoading] = useState(true);
//   const [minLoadTimePassed, setMinLoadTimePassed] = useState(false);
//   const [hasError, setHasError] = useState(false);
//   const [isTimeout, setIsTimeout] = useState(false);
//   const [retryCount, setRetryCount] = useState(0);

//   const [lightsBrightness, setLightsBrightness] = useState(100);
//   const [privacyMode, setPrivacyMode] = useState(false);
//   const [meetingOn, setMeetingOn] = useState(false);

//   const lastBrightnessRef = useRef(100);

//   const [curtainPosition, setCurtainPosition] = useState(0);
//   const [curtainMoving, setCurtainMoving] = useState<"up" | "down" | "stopped">(
//     "stopped",
//   );

//   const animationFrameRef = useRef<number | null>(null);
//   const lastPositionRef = useRef(0);
//   const loadingTimeoutRef = useRef<number | null>(null);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setMinLoadTimePassed(true);
//     }, 1000);
//     return () => clearTimeout(timer);
//   }, []);

//   useEffect(() => {
//     if (isLoading && !hasError) {
//       loadingTimeoutRef.current = window.setTimeout(() => {
//         setIsTimeout(true);
//       }, 30000);
//     }

//     return () => {
//       if (loadingTimeoutRef.current) {
//         clearTimeout(loadingTimeoutRef.current);
//       }
//     };
//   }, [isLoading, hasError]);

//   const handleLoaded = () => {
//     if (minLoadTimePassed) {
//       setIsLoading(false);
//       setHasError(false);
//       setIsTimeout(false);
//       setRetryCount(0);
//       if (loadingTimeoutRef.current) {
//         clearTimeout(loadingTimeoutRef.current);
//       }
//     } else {
//       const checkInterval = setInterval(() => {
//         if (minLoadTimePassed) {
//           setIsLoading(false);
//           setHasError(false);
//           setIsTimeout(false);
//           setRetryCount(0);
//           clearInterval(checkInterval);
//           if (loadingTimeoutRef.current) {
//             clearTimeout(loadingTimeoutRef.current);
//           }
//         }
//       }, 100);
//     }
//   };

//   const handleError = () => {
//     setHasError(true);
//     setIsLoading(true);
//     if (loadingTimeoutRef.current) {
//       clearTimeout(loadingTimeoutRef.current);
//     }
//   };

//   const handleRetry = () => {
//     if (retryCount < MAX_RETRY_ATTEMPTS) {
//       setRetryCount((prev) => prev + 1);
//       window.location.reload();
//     } else {
//       setRetryCount(0);
//       window.location.reload();
//     }
//   };

//   const handleLightsOn = () => {
//     if (lightsBrightness === 0) {
//       const targetBrightness =
//         lastBrightnessRef.current > 0 ? lastBrightnessRef.current : 100;
//       setLightsBrightness(targetBrightness);
//     }
//   };

//   const handleLightsOff = () => {
//     if (lightsBrightness > 0) {
//       lastBrightnessRef.current = lightsBrightness;
//       setLightsBrightness(0);
//     }
//   };

//   useEffect(() => {
//     if (lightsBrightness > 0) {
//       lastBrightnessRef.current = lightsBrightness;
//     }
//   }, [lightsBrightness]);

//   useEffect(() => {
//     if (curtainMoving === "stopped") {
//       if (animationFrameRef.current !== null) {
//         cancelAnimationFrame(animationFrameRef.current);
//         animationFrameRef.current = null;
//       }
//       return;
//     }

//     const speed = 0.0833;

//     const animate = () => {
//       setCurtainPosition((prev) => {
//         if (curtainMoving === "up") {
//           const newPos = prev + speed;
//           if (newPos >= 100) {
//             setCurtainMoving("stopped");
//             return 100;
//           }
//           return newPos;
//         } else if (curtainMoving === "down") {
//           const newPos = prev - speed;
//           if (newPos <= 0) {
//             setCurtainMoving("stopped");
//             return 0;
//           }
//           return newPos;
//         }
//         return prev;
//       });

//       animationFrameRef.current = requestAnimationFrame(animate);
//     };

//     animationFrameRef.current = requestAnimationFrame(animate);

//     return () => {
//       if (animationFrameRef.current !== null) {
//         cancelAnimationFrame(animationFrameRef.current);
//         animationFrameRef.current = null;
//       }
//     };
//   }, [curtainMoving]);

//   const handleCurtainUp = () => {
//     if (curtainPosition >= 100) {
//       return;
//     }
//     setCurtainMoving("up");
//   };

//   const handleCurtainDown = () => {
//     if (curtainPosition <= 0) {
//       return;
//     }
//     setCurtainMoving("down");
//   };

//   const handleCurtainStop = () => {
//     if (curtainMoving === "stopped") {
//       return;
//     }
//     setCurtainMoving("stopped");
//   };

//   useEffect(() => {
//     if (Math.abs(curtainPosition - lastPositionRef.current) > 0.01) {
//       lastPositionRef.current = curtainPosition;
//     }
//   }, [curtainPosition]);

//   return (
//     <div
//       style={{
//         width: "100vw",
//         height: "100vh",
//         margin: 0,
//         padding: 0,
//         overflow: "hidden",
//       }}
//     >
//       {isLoading && (
//         <LoadingScreen
//           hasError={hasError}
//           isTimeout={isTimeout}
//           onRetry={handleRetry}
//           autoRetrySeconds={AUTO_RETRY_DELAY}
//         />
//       )}

//       <div
//         style={{
//           width: "100%",
//           height: "100%",
//           opacity: isLoading ? 0 : 1,
//           transition: "opacity 0.5s",
//         }}
//       >
//         <div style={{ display: "" }}>
//           <ControlPanel
//             lightsBrightness={lightsBrightness}
//             setLightsBrightness={setLightsBrightness}
//             onLightsOn={handleLightsOn}
//             onLightsOff={handleLightsOff}
//             privacyMode={privacyMode}
//             setPrivacyMode={setPrivacyMode}
//             meetingOn={meetingOn}
//             setMeetingOn={setMeetingOn}
//             curtainPosition={curtainPosition}
//             onCurtainUp={handleCurtainUp}
//             onCurtainDown={handleCurtainDown}
//             onCurtainStop={handleCurtainStop}
//             curtainMoving={curtainMoving}
//           />
//         </div>

//         <Canvas
//           shadows
//           camera={{ position: [0, 1.6, 5], fov: 75, near: 0.1, far: 1000 }}
//           style={{ width: "100%", height: "100%", display: "block" }}
//           gl={{
//             antialias: true,
//             toneMapping: THREE.ACESFilmicToneMapping,
//             toneMappingExposure: 1.2,
//             outputColorSpace: THREE.SRGBColorSpace,
//           }}
//           onCreated={({ gl }) => {
//             gl.shadowMap.enabled = true;
//             gl.shadowMap.type = THREE.PCFSoftShadowMap;
//           }}
//         >
//           <color attach="background" args={["#87ceeb"]} />
//           <ErrorBoundary onError={handleError}>
//             <Suspense fallback={null}>
//               <Scene
//                 lightsBrightness={lightsBrightness}
//                 privacyMode={privacyMode}
//                 meetingOn={meetingOn}
//                 curtainPosition={curtainPosition}
//                 onLoaded={handleLoaded}
//                 onError={handleError}
//               />
//             </Suspense>
//           </ErrorBoundary>
//         </Canvas>
//       </div>
//     </div>
//   );
// }

// export default App;
