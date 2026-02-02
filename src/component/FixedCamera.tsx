import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";

function FixedCameraEnhanced() {
  const { camera, gl } = useThree();

  const mouseMovement = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: -0.1, y: -3.31 });
  const isLocked = useRef(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchActive = useRef(false);
  const velocity = useRef({ x: 0, y: 0 });

  const FIXED_POSITION = {
    x: 5.84,
    y: 1.84,
    z: -15.49,
  };

  const SENSITIVITY = {
    mouse: 0.002,
    touch: 0.005,
    damping: 0.85,
  };

  useEffect(() => {
    camera.position.set(FIXED_POSITION.x, FIXED_POSITION.y, FIXED_POSITION.z);

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
      if (!isLocked.current && !isTouchActive.current) {
        gl.domElement.requestPointerLock();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
        };
        isTouchActive.current = true;
        velocity.current = { x: 0, y: 0 };
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
    };

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

  useFrame(() => {
    if (isLocked.current || isTouchActive.current) {
      const sensitivity = isTouchActive.current
        ? SENSITIVITY.touch
        : SENSITIVITY.mouse;

      rotation.current.y -= mouseMovement.current.x * sensitivity;
      rotation.current.x -= mouseMovement.current.y * sensitivity;

      mouseMovement.current.x = 0;
      mouseMovement.current.y = 0;
    } else if (
      !isTouchActive.current &&
      (Math.abs(velocity.current.x) > 0.1 || Math.abs(velocity.current.y) > 0.1)
    ) {
      rotation.current.y -= velocity.current.x * SENSITIVITY.touch * 0.5;
      rotation.current.x -= velocity.current.y * SENSITIVITY.touch * 0.5;

      velocity.current.x *= SENSITIVITY.damping;
      velocity.current.y *= SENSITIVITY.damping;

      if (Math.abs(velocity.current.x) < 0.1) velocity.current.x = 0;
      if (Math.abs(velocity.current.y) < 0.1) velocity.current.y = 0;
    }

    rotation.current.x = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, rotation.current.x),
    );

    camera.rotation.order = "YXZ";
    camera.rotation.y = rotation.current.y;
    camera.rotation.x = rotation.current.x;

    camera.position.set(FIXED_POSITION.x, FIXED_POSITION.y, FIXED_POSITION.z);
  });

  return null;
}

export default FixedCameraEnhanced;
