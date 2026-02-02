import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";

function FixedRotationCameraAlt() {
  const { camera, gl } = useThree();
  const rotateSpeed = 0.002;

  const mouseMovement = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0, y: -3.36 }); // X = 0 for perfectly horizontal view
  const isLocked = useRef(false);
  const lastLogTime = useRef(0);

  useEffect(() => {
    // Fixed camera position AND rotation
    camera.position.set(5.89, 1.6, -15.31);

    // X = 0 for perfectly horizontal view (not looking up or down)
    rotation.current.x = 0;
    rotation.current.y = -3.36;

    console.log("📷 Camera FIXED at position: [5.89, 1.60, -15.31]");
    console.log("📷 Camera rotation: [0, -3.36] (HORIZONTAL VIEW - X=0)");
    console.log("🔒 Movement DISABLED - Rotation only!");
    console.log("🔧 ALTERNATIVE VERSION: Testing horizontal view");

    const handleMouseMove = (e: MouseEvent) => {
      if (isLocked.current) {
        mouseMovement.current.x = e.movementX;
        mouseMovement.current.y = e.movementY;
      }
    };

    const handlePointerLockChange = () => {
      isLocked.current = document.pointerLockElement === gl.domElement;
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
    // Only allow rotation, NO movement
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

    // Keep camera position FIXED - no movement allowed
    camera.position.set(5.89, 1.6, -15.31);

    // Debug logging every 2 seconds
    const currentTime = state.clock.elapsedTime;
    if (currentTime - lastLogTime.current >= 2.0) {
      console.log(
        `🔧 ALT - Rotation: [${rotation.current.x.toFixed(3)}, ${rotation.current.y.toFixed(3)}]`,
      );
      lastLogTime.current = currentTime;
    }
  });

  return null;
}

export default FixedRotationCameraAlt;
