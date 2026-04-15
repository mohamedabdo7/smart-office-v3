import { lazy, Suspense, useEffect, useState } from "react";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import FixedCameraEnhanced from "./FixedCamera";
import EnvironmentLighting from "./EnvironmentLighting";
import ClickHandler, { MeshGroups } from "./ClickHandler";
import { DeviceType } from "./DevicePopup";

const OfficeModel = lazy(() => import("./OfficeModel"));

interface SceneProps {
  lightsBrightness: number;
  privacyMode: boolean;
  meetingOn: boolean;
  curtainPosition: number;
  onLoaded: () => void;
  onError?: () => void;
  onDeviceClick: (
    device: DeviceType,
    screenPos: { x: number; y: number },
  ) => void;
}

function Scene({
  lightsBrightness,
  privacyMode,
  meetingOn,
  curtainPosition,
  onLoaded,
  onError,
  onDeviceClick,
}: SceneProps) {
  const [meshGroups, setMeshGroups] = useState<MeshGroups | null>(null);

  useEffect(() => {
    console.log("🎬 Scene component mounted");
  }, []);

  return (
    <>
      <Environment
        files="/models/img-bg.jpeg"
        background={true}
        environmentIntensity={0}
        backgroundRotation={[0, Math.PI * 1.5, 0]}
      />
      <Suspense fallback={null}>
        <EnvironmentLighting lightsBrightness={lightsBrightness} />
      </Suspense>
      <Suspense fallback={null}>
        <OfficeModel
          privacyMode={privacyMode}
          meetingOn={meetingOn}
          curtainPosition={curtainPosition}
          onLoaded={onLoaded}
          onError={onError}
          onMeshesReady={setMeshGroups}
        />
      </Suspense>
      <Suspense fallback={null}>
        <FixedCameraEnhanced />
      </Suspense>

      {/* 💡 Invisible ceiling plane — click target for lights control */}
      <mesh
        position={[0, 3.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          const { clientX, clientY } = e.nativeEvent as MouseEvent;
          onDeviceClick("lights", { x: clientX, y: clientY });
        }}
      >
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Raycasting handler for other devices */}
      <ClickHandler meshGroups={meshGroups} onDeviceClick={onDeviceClick} />
    </>
  );
}

export default Scene;
