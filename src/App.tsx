import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import ControlPanel from "./component/ControlPanel";
import LoadingScreen from "./component/LoadingScreen";
import ErrorBoundary from "./component/ErrorBoundary";

const Scene = lazy(() => import("./component/Scene"));

const MAX_RETRY_ATTEMPTS = 3;
const AUTO_RETRY_DELAY = 5;

// 🍎 Detect iOS/iPad
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

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

  // 🍎 iOS-specific: Minimum load time
  useEffect(() => {
    const minLoadTime = isIOS ? 1500 : 1000; // Longer for iOS
    const timer = setTimeout(() => {
      setMinLoadTimePassed(true);
    }, minLoadTime);
    return () => clearTimeout(timer);
  }, []);

  // 🍎 iOS-specific: Loading timeout
  useEffect(() => {
    if (isLoading && !hasError) {
      const timeout = isIOS ? 45000 : 30000; // 45s for iOS, 30s for others
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

  // 🍎 iOS-specific: Log device info
  useEffect(() => {
    if (isIOS) {
      console.log("🍎 Running on iOS device");
      console.log("Memory:", (performance as any).memory);
    }
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
          shadows={!isIOS} // 🍎 Disable shadows on iOS for performance
          camera={{ position: [0, 1.6, 5], fov: 75, near: 0.1, far: 1000 }}
          style={{ width: "100%", height: "100%", display: "block" }}
          gl={{
            antialias: !isIOS, // 🍎 Disable antialiasing on iOS
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            outputColorSpace: THREE.SRGBColorSpace,
            // 🍎 iOS-specific optimizations
            powerPreference: isIOS ? "low-power" : "high-performance",
            precision: isIOS ? "mediump" : "highp", // Lower precision on iOS
          }}
          onCreated={({ gl }) => {
            // 🍎 iOS-specific shadow settings
            if (!isIOS) {
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
            }

            // 🍎 Set pixel ratio (important for iPad retina displays)
            const pixelRatio = isIOS
              ? Math.min(window.devicePixelRatio, 2)
              : window.devicePixelRatio;
            gl.setPixelRatio(pixelRatio);

            console.log("🎨 Canvas created with pixel ratio:", pixelRatio);
          }}
          // 🍎 Performance mode for iOS
          performance={{ min: isIOS ? 0.5 : 0.75 }}
          dpr={isIOS ? [1, 2] : undefined} // Limit pixel ratio on iOS
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
