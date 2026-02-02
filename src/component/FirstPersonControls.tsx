import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Keys {
  [key: string]: boolean;
}

function FirstPersonControls() {
  const { camera, gl } = useThree();
  const moveSpeed = 0.1;
  const rotateSpeed = 0.002;

  const keysPressed = useRef<Keys>({});
  const mouseMovement = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0, y: 0 });
  const isLocked = useRef(false);
  const lastLogTime = useRef(0);

  useEffect(() => {
    camera.position.set(0, 1.6, 5);

    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║          🎮 FIRST PERSON CONTROLS ACTIVE 🎮          ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
    console.log("📷 Starting Position: [0, 1.6, 5]");
    console.log("🕹️  Controls:");
    console.log("   • WASD / Arrow Keys = Move");
    console.log("   • Mouse = Look Around");
    console.log("   • Space = Move Up");
    console.log("   • Shift = Move Down");
    console.log("   • Click Screen = Lock Mouse");
    console.log("═════════════════════════════════════════════════════════\n");

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isLocked.current) {
        mouseMovement.current.x = e.movementX;
        mouseMovement.current.y = e.movementY;
      }
    };

    const handlePointerLockChange = () => {
      isLocked.current = document.pointerLockElement === gl.domElement;
      if (isLocked.current) {
        console.log("🔒 Mouse Locked - Ready to explore!");
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
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    gl.domElement.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange,
      );
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [camera, gl]);

  useFrame((state) => {
    if (isLocked.current) {
      rotation.current.y -= mouseMovement.current.x * rotateSpeed;
      rotation.current.x -= mouseMovement.current.y * rotateSpeed;
      rotation.current.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, rotation.current.x),
      );

      mouseMovement.current.x = 0;
      mouseMovement.current.y = 0;
    }

    camera.rotation.order = "YXZ";
    camera.rotation.y = rotation.current.y;
    camera.rotation.x = rotation.current.x;

    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();

    camera.getWorldDirection(direction);
    right.crossVectors(camera.up, direction).normalize();

    if (keysPressed.current["arrowup"] || keysPressed.current["w"]) {
      camera.position.addScaledVector(direction, -moveSpeed);
    }
    if (keysPressed.current["arrowdown"] || keysPressed.current["s"]) {
      camera.position.addScaledVector(direction, moveSpeed);
    }
    if (keysPressed.current["arrowleft"] || keysPressed.current["a"]) {
      camera.position.addScaledVector(right, moveSpeed);
    }
    if (keysPressed.current["arrowright"] || keysPressed.current["d"]) {
      camera.position.addScaledVector(right, -moveSpeed);
    }
    if (keysPressed.current[" "]) {
      camera.position.y += moveSpeed;
    }
    if (keysPressed.current["shift"]) {
      camera.position.y -= moveSpeed;
    }

    // Log camera position every 1 second (faster updates!)
    const currentTime = state.clock.elapsedTime;
    // if (currentTime - lastLogTime.current >= 1.0) {
    //   console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    //   console.log("📷 CAMERA POSITION:");
    //   console.log(
    //     `   X: ${camera.position.x.toFixed(2)} | Y: ${camera.position.y.toFixed(2)} | Z: ${camera.position.z.toFixed(2)}`,
    //   );
    //   console.log("🎯 CAMERA ROTATION:");
    //   console.log(
    //     `   Pitch: ${rotation.current.x.toFixed(2)} | Yaw: ${rotation.current.y.toFixed(2)}`,
    //   );
    //   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    //   lastLogTime.current = currentTime;
    // }
  });

  return null;
}

export default FirstPersonControls;
