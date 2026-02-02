import React, { useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function FirstPersonCamera() {
  const { camera } = useThree();
  const moveSpeed = 0.1;
  const rotateSpeed = 0.002;

  const keysPressed = useRef({});
  const mouseMovement = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Set initial camera position
    camera.position.set(0, 1.6, 5); // Eye level height

    const handleKeyDown = (e) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e) => {
      mouseMovement.current.x = e.movementX;
      mouseMovement.current.y = e.movementY;
    };

    const handleClick = () => {
      document.body.requestPointerLock();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, [camera]);

  useFrame(() => {
    // Mouse look
    if (document.pointerLockElement) {
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

    // Movement
    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();

    camera.getWorldDirection(direction);
    right.crossVectors(camera.up, direction).normalize();

    if (keysPressed.current["w"]) {
      camera.position.addScaledVector(direction, -moveSpeed);
    }
    if (keysPressed.current["s"]) {
      camera.position.addScaledVector(direction, moveSpeed);
    }
    if (keysPressed.current["a"]) {
      camera.position.addScaledVector(right, moveSpeed);
    }
    if (keysPressed.current["d"]) {
      camera.position.addScaledVector(right, -moveSpeed);
    }
    if (keysPressed.current[" "]) {
      camera.position.y += moveSpeed;
    }
    if (keysPressed.current["shift"]) {
      camera.position.y -= moveSpeed;
    }
  });

  return null;
}

function Model() {
  const { scene } = useGLTF("/models/untitled1.glb");

  return <primitive object={scene} />;
}

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a1a" }}>
      {/* Instructions */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          fontFamily: "monospace",
          zIndex: 1,
          background: "rgba(0,0,0,0.7)",
          padding: "15px",
          borderRadius: "8px",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
          First Person Controls:
        </div>
        <div>• Click to lock pointer</div>
        <div>• WASD - Move around</div>
        <div>• Mouse - Look around</div>
        <div>• Space - Move up</div>
        <div>• Shift - Move down</div>
        <div>• ESC - Exit pointer lock</div>
      </div>

      <Canvas shadows camera={{ fov: 75, near: 0.1, far: 1000 }}>
        {/* Lights */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />

        {/* First Person Camera Controller */}
        <FirstPersonCamera />

        {/* Scene */}
        <Model />
      </Canvas>
    </div>
  );
}
