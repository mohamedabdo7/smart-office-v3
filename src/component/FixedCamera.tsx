import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";

function FixedCameraEnhanced() {
  const { camera, gl } = useThree();

  const mouseMovement = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: -0.1, y: -3.31 });
  const isLocked = useRef(false);
  const lastLogTime = useRef(0);

  // 📱 TOUCH SUPPORT - Enhanced
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchActive = useRef(false);
  const velocity = useRef({ x: 0, y: 0 }); // للحركة السلسة

  // ⚙️ SETTINGS
  const FIXED_POSITION = {
    x: 5.84,
    y: 1.84,
    z: -15.49,
  };

  const SENSITIVITY = {
    mouse: 0.002,
    touch: 0.005, // أعلى شوية للتاتش
    damping: 0.85, // للحركة السلسة (momentum)
  };

  useEffect(() => {
    camera.position.set(FIXED_POSITION.x, FIXED_POSITION.y, FIXED_POSITION.z);

    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║     📍 FIXED CAMERA MODE (Enhanced) 📍              ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
    console.log("📷 Camera Position (LOCKED):");
    console.log(
      `   X: ${FIXED_POSITION.x} | Y: ${FIXED_POSITION.y} | Z: ${FIXED_POSITION.z}`,
    );
    console.log("\n🕹️  Controls:");
    console.log("   🖱️  Desktop: Click + Drag with Mouse");
    console.log("   📱 Mobile/iPad: Drag with Touch");
    console.log("   ✨ Enhanced: Smooth momentum + Better sensitivity");
    console.log("═════════════════════════════════════════════════════════\n");

    // ========================================
    // MOUSE CONTROLS
    // ========================================
    const handleMouseMove = (e: MouseEvent) => {
      if (isLocked.current) {
        mouseMovement.current.x = e.movementX;
        mouseMovement.current.y = e.movementY;
      }
    };

    const handlePointerLockChange = () => {
      isLocked.current = document.pointerLockElement === gl.domElement;
      if (isLocked.current) {
        console.log("🔒 Mouse Locked");
      } else {
        console.log("🔓 Mouse Unlocked");
      }
    };

    const handleClick = () => {
      if (!isLocked.current && !isTouchActive.current) {
        gl.domElement.requestPointerLock();
      }
    };

    // ========================================
    // TOUCH CONTROLS (Enhanced) 📱
    // ========================================
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
        };
        isTouchActive.current = true;
        velocity.current = { x: 0, y: 0 }; // Reset velocity
        console.log("📱 Touch started");
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (
        e.touches.length === 1 &&
        touchStartRef.current &&
        isTouchActive.current
      ) {
        e.preventDefault();

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;

        // Calculate velocity for momentum
        velocity.current.x = deltaX;
        velocity.current.y = deltaY;

        mouseMovement.current.x = deltaX;
        mouseMovement.current.y = deltaY;

        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
        };
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
      isTouchActive.current = false;
      // Keep velocity for momentum effect
      console.log("📱 Touch ended - momentum active");
    };

    // ========================================
    // EVENT LISTENERS
    // ========================================
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    window.addEventListener("mousemove", handleMouseMove);
    gl.domElement.addEventListener("click", handleClick);

    gl.domElement.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    gl.domElement.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    gl.domElement.addEventListener("touchend", handleTouchEnd);
    gl.domElement.addEventListener("touchcancel", handleTouchEnd);

    // Cleanup
    return () => {
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange,
      );
      window.removeEventListener("mousemove", handleMouseMove);
      gl.domElement.removeEventListener("click", handleClick);
      gl.domElement.removeEventListener("touchstart", handleTouchStart);
      gl.domElement.removeEventListener("touchmove", handleTouchMove);
      gl.domElement.removeEventListener("touchend", handleTouchEnd);
      gl.domElement.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [camera, gl]);

  useFrame((state) => {
    // ========================================
    // ROTATION LOGIC
    // ========================================

    // Active control (mouse or touch)
    if (isLocked.current || isTouchActive.current) {
      const sensitivity = isTouchActive.current
        ? SENSITIVITY.touch
        : SENSITIVITY.mouse;

      rotation.current.y -= mouseMovement.current.x * sensitivity;
      rotation.current.x -= mouseMovement.current.y * sensitivity;

      mouseMovement.current.x = 0;
      mouseMovement.current.y = 0;
    }
    // Momentum effect when touch released
    else if (
      !isTouchActive.current &&
      (Math.abs(velocity.current.x) > 0.1 || Math.abs(velocity.current.y) > 0.1)
    ) {
      rotation.current.y -= velocity.current.x * SENSITIVITY.touch * 0.5;
      rotation.current.x -= velocity.current.y * SENSITIVITY.touch * 0.5;

      // Apply damping
      velocity.current.x *= SENSITIVITY.damping;
      velocity.current.y *= SENSITIVITY.damping;

      // Stop when velocity is very low
      if (Math.abs(velocity.current.x) < 0.1) velocity.current.x = 0;
      if (Math.abs(velocity.current.y) < 0.1) velocity.current.y = 0;
    }

    // Clamp pitch (up/down rotation)
    rotation.current.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, rotation.current.x),
    );

    // Apply rotation
    camera.rotation.order = "YXZ";
    camera.rotation.y = rotation.current.y;
    camera.rotation.x = rotation.current.x;

    // 🔒 CRITICAL: Keep position fixed
    camera.position.set(FIXED_POSITION.x, FIXED_POSITION.y, FIXED_POSITION.z);

    // Debug logging
    const currentTime = state.clock.elapsedTime;
    if (currentTime - lastLogTime.current >= 2.0) {
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📷 CAMERA STATUS:");
      console.log(
        `   Position: [${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}]`,
      );
      console.log(
        `   Rotation: Pitch ${rotation.current.x.toFixed(2)} | Yaw ${rotation.current.y.toFixed(2)}`,
      );
      console.log(
        `   📱 Touch: ${isTouchActive.current ? "Active" : "Inactive"}`,
      );
      console.log(
        `   💨 Momentum: X ${velocity.current.x.toFixed(2)} | Y ${velocity.current.y.toFixed(2)}`,
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      lastLogTime.current = currentTime;
    }
  });

  return null;
}

export default FixedCameraEnhanced;

// import { useEffect, useRef } from "react";
// import { useThree, useFrame } from "@react-three/fiber";

// function FixedCamera() {
//   const { camera, gl } = useThree();
//   const rotateSpeed = 0.002;

//   const mouseMovement = useRef({ x: 0, y: 0 });
//   const rotation = useRef({ x: -0.1, y: -3.31 }); // البداية من نفس الزاوية اللي كنت واقف عندها
//   const isLocked = useRef(false);
//   const lastLogTime = useRef(0);

//   // 📍 FIXED POSITION - لا تتحرك أبداً
//   const FIXED_POSITION = {
//     x: 5.84,
//     y: 1.84,
//     z: -15.49,
//   };

//   useEffect(() => {
//     // تثبيت الكاميرا في المكان المحدد
//     camera.position.set(FIXED_POSITION.x, FIXED_POSITION.y, FIXED_POSITION.z);

//     console.log("\n╔═══════════════════════════════════════════════════════╗");
//     console.log("║            📍 FIXED CAMERA MODE 📍                   ║");
//     console.log("╚═══════════════════════════════════════════════════════╝");
//     console.log("📷 Camera Position (LOCKED):");
//     console.log(
//       `   X: ${FIXED_POSITION.x} | Y: ${FIXED_POSITION.y} | Z: ${FIXED_POSITION.z}`,
//     );
//     console.log("🎯 Starting Rotation:");
//     console.log(
//       `   Pitch: ${rotation.current.x.toFixed(2)} | Yaw: ${rotation.current.y.toFixed(2)}`,
//     );
//     console.log("\n🕹️  Controls:");
//     console.log("   • Mouse = Look Around (Rotation ONLY)");
//     console.log("   • Click Screen = Lock Mouse");
//     console.log("   • No Movement Keys - Camera is FIXED");
//     console.log("═════════════════════════════════════════════════════════\n");

//     const handleMouseMove = (e: MouseEvent) => {
//       if (isLocked.current) {
//         mouseMovement.current.x = e.movementX;
//         mouseMovement.current.y = e.movementY;
//       }
//     };

//     const handlePointerLockChange = () => {
//       isLocked.current = document.pointerLockElement === gl.domElement;
//       if (isLocked.current) {
//         console.log("🔒 Mouse Locked - Rotate camera with mouse!");
//       } else {
//         console.log("🔓 Mouse Unlocked");
//       }
//     };

//     const handleClick = () => {
//       if (!isLocked.current) {
//         gl.domElement.requestPointerLock();
//       }
//     };

//     document.addEventListener("pointerlockchange", handlePointerLockChange);
//     window.addEventListener("mousemove", handleMouseMove);
//     gl.domElement.addEventListener("click", handleClick);

//     return () => {
//       document.removeEventListener(
//         "pointerlockchange",
//         handlePointerLockChange,
//       );
//       window.removeEventListener("mousemove", handleMouseMove);
//       gl.domElement.removeEventListener("click", handleClick);
//     };
//   }, [camera, gl]);

//   useFrame((state) => {
//     // التدوير بالماوس
//     if (isLocked.current) {
//       rotation.current.y -= mouseMovement.current.x * rotateSpeed;
//       rotation.current.x -= mouseMovement.current.y * rotateSpeed;

//       // حد أقصى للنظر لأعلى ولأسفل
//       rotation.current.x = Math.max(
//         -Math.PI / 2,
//         Math.min(Math.PI / 2, rotation.current.x),
//       );

//       mouseMovement.current.x = 0;
//       mouseMovement.current.y = 0;
//     }

//     // تطبيق التدوير على الكاميرا
//     camera.rotation.order = "YXZ";
//     camera.rotation.y = rotation.current.y;
//     camera.rotation.x = rotation.current.x;

//     // 🔒 CRITICAL: إعادة تثبيت الموقع في كل frame
//     // هذا يضمن أن الكاميرا لا تتحرك أبداً حتى لو حاول أي كود آخر تحريكها
//     camera.position.set(FIXED_POSITION.x, FIXED_POSITION.y, FIXED_POSITION.z);

//     // Logging كل 2 ثانية
//     const currentTime = state.clock.elapsedTime;
//     if (currentTime - lastLogTime.current >= 2.0) {
//       console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
//       console.log("📷 CAMERA (FIXED):");
//       console.log(
//         `   Position: X: ${camera.position.x.toFixed(2)} | Y: ${camera.position.y.toFixed(2)} | Z: ${camera.position.z.toFixed(2)}`,
//       );
//       console.log("🎯 ROTATION:");
//       console.log(
//         `   Pitch: ${rotation.current.x.toFixed(2)} | Yaw: ${rotation.current.y.toFixed(2)}`,
//       );
//       console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
//       lastLogTime.current = currentTime;
//     }
//   });

//   return null;
// }

// export default FixedCamera;
