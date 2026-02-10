import { lazy, Suspense, useEffect } from "react";
import FixedCameraEnhanced from "./FixedCamera";
import EnvironmentLighting from "./EnvironmentLighting";
import { Environment } from "@react-three/drei";

const OfficeModel = lazy(() => import("./OfficeModel"));

interface SceneProps {
  lightsBrightness: number;
  privacyMode: boolean;
  meetingOn: boolean;
  curtainPosition: number;
  onLoaded: () => void;
  onError?: () => void;
}

function Scene({
  lightsBrightness,
  privacyMode,
  meetingOn,
  curtainPosition,
  onLoaded,
  onError,
}: SceneProps) {
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
        />
      </Suspense>
      <Suspense fallback={null}>
        <FixedCameraEnhanced />
      </Suspense>
    </>
  );
}

export default Scene;
