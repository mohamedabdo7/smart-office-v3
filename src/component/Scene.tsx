import { lazy, Suspense } from "react";
import FixedCameraEnhanced from "./FixedCamera";
import EnvironmentLighting from "./EnvironmentLighting";

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
  return (
    <>
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
