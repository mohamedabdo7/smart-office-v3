import { lazy, Suspense } from "react";
import FixedCamera from "./FixedCamera";
import FirstPersonControls from "./FirstPersonControls";

const OfficeModel = lazy(() => import("./OfficeModel"));
const EnvironmentLighting = lazy(() => import("./EnvironmentLighting"));

interface SceneProps {
  lightsBrightness: number;
  privacyMode: boolean;
  meetingOn: boolean;
  curtainPosition: number; // NEW!
  onLoaded: () => void;
}

function Scene({
  lightsBrightness,
  privacyMode,
  meetingOn,
  curtainPosition,
  onLoaded,
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
        />
      </Suspense>
      <Suspense fallback={null}>
        {/* <FirstPersonControls /> */}
        <FixedCamera />
      </Suspense>
    </>
  );
}

export default Scene;
