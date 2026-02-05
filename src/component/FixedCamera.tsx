import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";

function FixedCameraEnhanced() {
  const { camera, gl } = useThree();

  const rotation = useRef({ x: -0.1, y: -3.31 });
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });

  // Touch support
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchActive = useRef(false);

  const FIXED_POSITION = {
    x: 5.84,
    y: 1.84,
    z: -15.49,
  };

  // 📱 Detect WebView for sensitivity adjustment
  const isWebView = (() => {
    const ua = navigator.userAgent;
    return (
      ua.includes("Flutter") ||
      /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua) ||
      ua.includes("wv")
    );
  })();

  const SENSITIVITY = {
    mouse: 0.003,
    touch: isWebView ? 0.006 : 0.005, // 📱 Higher sensitivity for WebView
  };

  useEffect(() => {
    console.log("🎥 Camera initializing...", {
      position: FIXED_POSITION,
      rotation: rotation.current,
      isWebView,
    });

    camera.position.set(FIXED_POSITION.x, FIXED_POSITION.y, FIXED_POSITION.z);

    // Mouse drag controls
    const handleMouseDown = (e: MouseEvent) => {
      console.log("🖱️ Mouse down");
      isDragging.current = true;
      previousMouse.current = { x: e.clientX, y: e.clientY };
      gl.domElement.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const deltaX = e.clientX - previousMouse.current.x;
        const deltaY = e.clientY - previousMouse.current.y;

        rotation.current.y -= deltaX * SENSITIVITY.mouse;
        rotation.current.x -= deltaY * SENSITIVITY.mouse;

        previousMouse.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      gl.domElement.style.cursor = "grab";
    };

    // Touch controls - ENHANCED for WebView
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        console.log("👆 Touch start");
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
        };
        isTouchActive.current = true;

        // 📱 Prevent default to avoid WebView interference
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (
        e.touches.length === 1 &&
        touchStartRef.current &&
        isTouchActive.current
      ) {
        e.preventDefault(); // 📱 CRITICAL for WebView

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;

        rotation.current.y -= deltaX * SENSITIVITY.touch;
        rotation.current.x -= deltaY * SENSITIVITY.touch;

        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
        };
      }
    };

    const handleTouchEnd = () => {
      console.log("👆 Touch end");
      touchStartRef.current = null;
      isTouchActive.current = false;
    };

    // Set initial cursor
    gl.domElement.style.cursor = "grab";

    // Add event listeners
    gl.domElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // 📱 WebView: passive: false is CRITICAL for preventDefault to work
    gl.domElement.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    gl.domElement.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    gl.domElement.addEventListener("touchend", handleTouchEnd);
    gl.domElement.addEventListener("touchcancel", handleTouchEnd);

    console.log("✅ Camera event listeners added");

    return () => {
      gl.domElement.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      gl.domElement.removeEventListener("touchstart", handleTouchStart);
      gl.domElement.removeEventListener("touchmove", handleTouchMove);
      gl.domElement.removeEventListener("touchend", handleTouchEnd);
      gl.domElement.removeEventListener("touchcancel", handleTouchEnd);
      gl.domElement.style.cursor = "default";

      console.log("🧹 Camera cleanup done");
    };
  }, [camera, gl, isWebView]);

  useFrame(() => {
    // Clamp pitch (up/down rotation)
    rotation.current.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, rotation.current.x),
    );

    // Apply rotation
    camera.rotation.order = "YXZ";
    camera.rotation.y = rotation.current.y;
    camera.rotation.x = rotation.current.x;

    // Keep position fixed
    camera.position.set(FIXED_POSITION.x, FIXED_POSITION.y, FIXED_POSITION.z);
  });

  return null;
}

export default FixedCameraEnhanced;

// import { useEffect, useRef } from "react";
// import { useThree, useFrame } from "@react-three/fiber";

// function FixedCameraEnhanced() {
//   const { camera, gl } = useThree();

//   const rotation = useRef({ x: -0.1, y: -3.31 });
//   const isDragging = useRef(false);
//   const previousMouse = useRef({ x: 0, y: 0 });

//   // Touch support
//   const touchStartRef = useRef<{ x: number; y: number } | null>(null);
//   const isTouchActive = useRef(false);

//   const FIXED_POSITION = {
//     x: 5.84,
//     y: 1.84,
//     z: -15.49,
//   };

//   const SENSITIVITY = {
//     mouse: 0.003,
//     touch: 0.005,
//   };

//   useEffect(() => {
//     camera.position.set(FIXED_POSITION.x, FIXED_POSITION.y, FIXED_POSITION.z);

//     // Mouse drag controls
//     const handleMouseDown = (e: MouseEvent) => {
//       isDragging.current = true;
//       previousMouse.current = { x: e.clientX, y: e.clientY };
//       gl.domElement.style.cursor = "grabbing";
//     };

//     const handleMouseMove = (e: MouseEvent) => {
//       if (isDragging.current) {
//         const deltaX = e.clientX - previousMouse.current.x;
//         const deltaY = e.clientY - previousMouse.current.y;

//         rotation.current.y -= deltaX * SENSITIVITY.mouse;
//         rotation.current.x -= deltaY * SENSITIVITY.mouse;

//         previousMouse.current = { x: e.clientX, y: e.clientY };
//       }
//     };

//     const handleMouseUp = () => {
//       isDragging.current = false;
//       gl.domElement.style.cursor = "grab";
//     };

//     // Touch controls
//     const handleTouchStart = (e: TouchEvent) => {
//       if (e.touches.length === 1) {
//         const touch = e.touches[0];
//         touchStartRef.current = {
//           x: touch.clientX,
//           y: touch.clientY,
//         };
//         isTouchActive.current = true;
//       }
//     };

//     const handleTouchMove = (e: TouchEvent) => {
//       if (
//         e.touches.length === 1 &&
//         touchStartRef.current &&
//         isTouchActive.current
//       ) {
//         e.preventDefault();

//         const touch = e.touches[0];
//         const deltaX = touch.clientX - touchStartRef.current.x;
//         const deltaY = touch.clientY - touchStartRef.current.y;

//         rotation.current.y -= deltaX * SENSITIVITY.touch;
//         rotation.current.x -= deltaY * SENSITIVITY.touch;

//         touchStartRef.current = {
//           x: touch.clientX,
//           y: touch.clientY,
//         };
//       }
//     };

//     const handleTouchEnd = () => {
//       touchStartRef.current = null;
//       isTouchActive.current = false;
//     };

//     // Set initial cursor
//     gl.domElement.style.cursor = "grab";

//     // Add event listeners
//     gl.domElement.addEventListener("mousedown", handleMouseDown);
//     window.addEventListener("mousemove", handleMouseMove);
//     window.addEventListener("mouseup", handleMouseUp);

//     gl.domElement.addEventListener("touchstart", handleTouchStart, {
//       passive: false,
//     });
//     gl.domElement.addEventListener("touchmove", handleTouchMove, {
//       passive: false,
//     });
//     gl.domElement.addEventListener("touchend", handleTouchEnd);
//     gl.domElement.addEventListener("touchcancel", handleTouchEnd);

//     return () => {
//       gl.domElement.removeEventListener("mousedown", handleMouseDown);
//       window.removeEventListener("mousemove", handleMouseMove);
//       window.removeEventListener("mouseup", handleMouseUp);
//       gl.domElement.removeEventListener("touchstart", handleTouchStart);
//       gl.domElement.removeEventListener("touchmove", handleTouchMove);
//       gl.domElement.removeEventListener("touchend", handleTouchEnd);
//       gl.domElement.removeEventListener("touchcancel", handleTouchEnd);
//       gl.domElement.style.cursor = "default";
//     };
//   }, [camera, gl]);

//   useFrame(() => {
//     // Clamp pitch (up/down rotation)
//     rotation.current.x = Math.max(
//       -Math.PI / 2,
//       Math.min(Math.PI / 2, rotation.current.x),
//     );

//     // Apply rotation
//     camera.rotation.order = "YXZ";
//     camera.rotation.y = rotation.current.y;
//     camera.rotation.x = rotation.current.x;

//     // Keep position fixed
//     camera.position.set(FIXED_POSITION.x, FIXED_POSITION.y, FIXED_POSITION.z);
//   });

//   return null;
// }

// export default FixedCameraEnhanced;
