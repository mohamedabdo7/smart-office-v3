import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";

function FixedCamera() {
  const { camera, gl } = useThree();
  const rotateSpeed = 0.002;

  const mouseMovement = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: -0.1, y: -3.31 }); // البداية من نفس الزاوية اللي كنت واقف عندها
  const isLocked = useRef(false);
  const lastLogTime = useRef(0);

  // 📍 FIXED POSITION - لا تتحرك أبداً
  const FIXED_POSITION = {
    x: 5.84,
    y: 1.84,
    z: -15.49,
  };

  useEffect(() => {
    // تثبيت الكاميرا في المكان المحدد
    camera.position.set(FIXED_POSITION.x, FIXED_POSITION.y, FIXED_POSITION.z);

    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║            📍 FIXED CAMERA MODE 📍                   ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
    console.log("📷 Camera Position (LOCKED):");
    console.log(
      `   X: ${FIXED_POSITION.x} | Y: ${FIXED_POSITION.y} | Z: ${FIXED_POSITION.z}`,
    );
    console.log("🎯 Starting Rotation:");
    console.log(
      `   Pitch: ${rotation.current.x.toFixed(2)} | Yaw: ${rotation.current.y.toFixed(2)}`,
    );
    console.log("\n🕹️  Controls:");
    console.log("   • Mouse = Look Around (Rotation ONLY)");
    console.log("   • Click Screen = Lock Mouse");
    console.log("   • No Movement Keys - Camera is FIXED");
    console.log("═════════════════════════════════════════════════════════\n");

    const handleMouseMove = (e: MouseEvent) => {
      if (isLocked.current) {
        mouseMovement.current.x = e.movementX;
        mouseMovement.current.y = e.movementY;
      }
    };

    const handlePointerLockChange = () => {
      isLocked.current = document.pointerLockElement === gl.domElement;
      if (isLocked.current) {
        console.log("🔒 Mouse Locked - Rotate camera with mouse!");
      } else {
        console.log("🔓 Mouse Unlocked");
      }
    };

    const handleClick = () => {
      if (!isLocked.current) {
        gl.domElement.requestPointerLock();
      }
    };

    document.addEventListener("pointerlockchange", handlePointerLockChange);
    window.addEventListener("mousemove", handleMouseMove);
    gl.domElement.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange,
      );
      window.removeEventListener("mousemove", handleMouseMove);
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [camera, gl]);

  useFrame((state) => {
    // التدوير بالماوس
    if (isLocked.current) {
      rotation.current.y -= mouseMovement.current.x * rotateSpeed;
      rotation.current.x -= mouseMovement.current.y * rotateSpeed;

      // حد أقصى للنظر لأعلى ولأسفل
      rotation.current.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, rotation.current.x),
      );

      mouseMovement.current.x = 0;
      mouseMovement.current.y = 0;
    }

    // تطبيق التدوير على الكاميرا
    camera.rotation.order = "YXZ";
    camera.rotation.y = rotation.current.y;
    camera.rotation.x = rotation.current.x;

    // 🔒 CRITICAL: إعادة تثبيت الموقع في كل frame
    // هذا يضمن أن الكاميرا لا تتحرك أبداً حتى لو حاول أي كود آخر تحريكها
    camera.position.set(FIXED_POSITION.x, FIXED_POSITION.y, FIXED_POSITION.z);

    // Logging كل 2 ثانية
    const currentTime = state.clock.elapsedTime;
    if (currentTime - lastLogTime.current >= 2.0) {
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📷 CAMERA (FIXED):");
      console.log(
        `   Position: X: ${camera.position.x.toFixed(2)} | Y: ${camera.position.y.toFixed(2)} | Z: ${camera.position.z.toFixed(2)}`,
      );
      console.log("🎯 ROTATION:");
      console.log(
        `   Pitch: ${rotation.current.x.toFixed(2)} | Yaw: ${rotation.current.y.toFixed(2)}`,
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      lastLogTime.current = currentTime;
    }
  });

  return null;
}

export default FixedCamera;
