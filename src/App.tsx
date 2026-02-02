import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import ControlPanel from "./component/ControlPanel";
import LoadingScreen from "./component/LoadingScreen";

const Scene = lazy(() => import("./component/Scene"));

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [minLoadTimePassed, setMinLoadTimePassed] = useState(false);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadTimePassed(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLoaded = () => {
    if (minLoadTimePassed) {
      setIsLoading(false);
    } else {
      const checkInterval = setInterval(() => {
        if (minLoadTimePassed) {
          setIsLoading(false);
          clearInterval(checkInterval);
        }
      }, 100);
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

    const speed = 0.5;

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
      {isLoading && <LoadingScreen />}

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
          <Suspense fallback={null}>
            <Scene
              lightsBrightness={lightsBrightness}
              privacyMode={privacyMode}
              meetingOn={meetingOn}
              curtainPosition={curtainPosition}
              onLoaded={handleLoaded}
            />
          </Suspense>
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

// const Scene = lazy(() => import("./component/Scene"));

// function App() {
//   const [isLoading, setIsLoading] = useState(true);
//   const [minLoadTimePassed, setMinLoadTimePassed] = useState(false);
//   const [lightsBrightness, setLightsBrightness] = useState(100);
//   const [privacyMode, setPrivacyMode] = useState(false);
//   const [meetingOn, setMeetingOn] = useState(false);

//   // Curtain States
//   const [curtainPosition, setCurtainPosition] = useState(0); // 0-100%
//   const [curtainMoving, setCurtainMoving] = useState<"up" | "down" | "stopped">(
//     "stopped",
//   );

//   // Refs for debugging
//   const animationFrameRef = useRef<number | null>(null);
//   const lastPositionRef = useRef(0);

//   // Ensure loading screen shows for at least 1 second
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setMinLoadTimePassed(true);
//     }, 1000);
//     return () => clearTimeout(timer);
//   }, []);

//   const handleLoaded = () => {
//     if (minLoadTimePassed) {
//       setIsLoading(false);
//     } else {
//       const checkInterval = setInterval(() => {
//         if (minLoadTimePassed) {
//           setIsLoading(false);
//           clearInterval(checkInterval);
//         }
//       }, 100);
//     }
//   };

//   // Curtain Animation Loop - FIXED WITH LOGS!
//   useEffect(() => {
//     console.log("\n╔════════════════════════════════════════╗");
//     console.log(`║  🪟 CURTAIN ANIMATION EFFECT TRIGGERED ║`);
//     console.log("╚════════════════════════════════════════╝");
//     console.log(`📍 Current Position: ${curtainPosition.toFixed(2)}%`);
//     console.log(`🎬 Movement State: ${curtainMoving}`);
//     console.log(`⏱️ Effect triggered at: ${new Date().toLocaleTimeString()}\n`);

//     if (curtainMoving === "stopped") {
//       console.log("⏸️ STOPPED - Canceling animation");
//       if (animationFrameRef.current !== null) {
//         cancelAnimationFrame(animationFrameRef.current);
//         animationFrameRef.current = null;
//         console.log("✅ Animation frame canceled\n");
//       }
//       return;
//     }

//     const speed = 0.5; // 0.5% per frame
//     console.log(`⚡ Starting animation with speed: ${speed}%/frame`);
//     console.log(`🎯 Target: ${curtainMoving === "up" ? "100%" : "0%"}\n`);

//     let frameCount = 0;

//     const animate = () => {
//       frameCount++;

//       setCurtainPosition((prev) => {
//         const prevRounded = Math.round(prev * 100) / 100;

//         if (curtainMoving === "up") {
//           const newPos = prev + speed;
//           const newPosRounded = Math.round(newPos * 100) / 100;

//           console.log(
//             `🔼 UP - Frame ${frameCount}: ${prevRounded.toFixed(2)}% → ${newPosRounded.toFixed(2)}%`,
//           );

//           if (newPos >= 100) {
//             console.log("\n🎯 Reached 100% - STOPPING");
//             console.log("═══════════════════════════════════════\n");
//             setCurtainMoving("stopped");
//             return 100;
//           }
//           return newPos;
//         } else if (curtainMoving === "down") {
//           const newPos = prev - speed;
//           const newPosRounded = Math.round(newPos * 100) / 100;

//           console.log(
//             `🔽 DOWN - Frame ${frameCount}: ${prevRounded.toFixed(2)}% → ${newPosRounded.toFixed(2)}%`,
//           );

//           if (newPos <= 0) {
//             console.log("\n🎯 Reached 0% - STOPPING");
//             console.log("═══════════════════════════════════════\n");
//             setCurtainMoving("stopped");
//             return 0;
//           }
//           return newPos;
//         }

//         return prev;
//       });

//       // Continue animation
//       animationFrameRef.current = requestAnimationFrame(animate);
//     };

//     // Start animation
//     animationFrameRef.current = requestAnimationFrame(animate);

//     // Cleanup
//     return () => {
//       console.log(
//         `\n🧹 CLEANUP - Canceling animation (ran ${frameCount} frames)`,
//       );
//       if (animationFrameRef.current !== null) {
//         cancelAnimationFrame(animationFrameRef.current);
//         animationFrameRef.current = null;
//       }
//       console.log("═══════════════════════════════════════\n");
//     };
//   }, [curtainMoving]); // CRITICAL: Only depend on curtainMoving, NOT curtainPosition!

//   const handleCurtainUp = () => {
//     console.log("\n┌─────────────────────────────────────┐");
//     console.log("│  🔼 UP BUTTON PRESSED               │");
//     console.log("└─────────────────────────────────────┘");
//     console.log(`📍 Current Position: ${curtainPosition.toFixed(2)}%`);
//     console.log(`🎬 Current State: ${curtainMoving}`);

//     if (curtainPosition >= 100) {
//       console.log("⚠️ Already at 100% - Ignoring\n");
//       return;
//     }

//     console.log("✅ Setting state to 'up'\n");
//     setCurtainMoving("up");
//   };

//   const handleCurtainDown = () => {
//     console.log("\n┌─────────────────────────────────────┐");
//     console.log("│  🔽 DOWN BUTTON PRESSED             │");
//     console.log("└─────────────────────────────────────┘");
//     console.log(`📍 Current Position: ${curtainPosition.toFixed(2)}%`);
//     console.log(`🎬 Current State: ${curtainMoving}`);

//     if (curtainPosition <= 0) {
//       console.log("⚠️ Already at 0% - Ignoring\n");
//       return;
//     }

//     console.log("✅ Setting state to 'down'\n");
//     setCurtainMoving("down");
//   };

//   const handleCurtainStop = () => {
//     console.log("\n┌─────────────────────────────────────┐");
//     console.log("│  ⏸️ STOP BUTTON PRESSED             │");
//     console.log("└─────────────────────────────────────┘");
//     console.log(`📍 Current Position: ${curtainPosition.toFixed(2)}%`);
//     console.log(`🎬 Current State: ${curtainMoving}`);

//     if (curtainMoving === "stopped") {
//       console.log("⚠️ Already stopped - Ignoring\n");
//       return;
//     }

//     console.log("✅ Setting state to 'stopped'\n");
//     setCurtainMoving("stopped");
//   };

//   // Log position changes
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
//       {isLoading && <LoadingScreen />}

//       <div
//         style={{
//           width: "100%",
//           height: "100%",
//           opacity: isLoading ? 0 : 1,
//           transition: "opacity 0.5s",
//         }}
//       >
//         <ControlPanel
//           lightsBrightness={lightsBrightness}
//           setLightsBrightness={setLightsBrightness}
//           privacyMode={privacyMode}
//           setPrivacyMode={setPrivacyMode}
//           meetingOn={meetingOn}
//           setMeetingOn={setMeetingOn}
//           curtainPosition={curtainPosition}
//           onCurtainUp={handleCurtainUp}
//           onCurtainDown={handleCurtainDown}
//           onCurtainStop={handleCurtainStop}
//           curtainMoving={curtainMoving}
//         />

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
//           <Suspense fallback={null}>
//             <Scene
//               lightsBrightness={lightsBrightness}
//               privacyMode={privacyMode}
//               meetingOn={meetingOn}
//               curtainPosition={curtainPosition}
//               onLoaded={handleLoaded}
//             />
//           </Suspense>
//         </Canvas>
//       </div>
//     </div>
//   );
// }

// export default App;
