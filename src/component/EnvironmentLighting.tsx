interface EnvironmentLightingProps {
  lightsBrightness: number; // 0-100
}

function EnvironmentLighting({ lightsBrightness }: EnvironmentLightingProps) {
  // Calculate intensity based on brightness percentage
  const brightness = lightsBrightness / 100; // 0.0 to 1.0

  // Adjust intensities based on brightness
  const ambientIntensity = 1.5 * brightness;
  const pointIntensity = 18 * brightness;
  const hemisphereIntensity = 0.7 * brightness;

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={ambientIntensity} color="#fff8f0" />

      {/* Grid of point lights */}

      {/* Front Left */}
      <pointLight
        position={[2, 2.0, -8]}
        intensity={pointIntensity}
        color="#fff"
        distance={14}
        decay={2}
      />

      {/* Front Right */}
      <pointLight
        position={[5, 2.0, -8]}
        intensity={pointIntensity}
        color="#fff"
        distance={14}
        decay={2}
      />

      {/* Middle Left */}
      <pointLight
        position={[3, 2.0, -14]}
        intensity={pointIntensity}
        color="#fff"
        distance={14}
        decay={2}
      />

      {/* Middle Right */}
      <pointLight
        position={[7, 2.0, -12]}
        intensity={pointIntensity}
        color="#fff"
        distance={14}
        decay={2}
      />

      {/* Back Left */}
      <pointLight
        position={[3, 2.0, -16]}
        intensity={pointIntensity}
        color="#fff"
        distance={14}
        decay={2}
      />

      {/* Back Right */}
      <pointLight
        position={[7, 2.0, -16]}
        intensity={pointIntensity}
        color="#fff"
        distance={14}
        decay={2}
      />

      {/* Hemisphere for ambient bounce */}
      <hemisphereLight
        color="#ffffff"
        groundColor="#d8d8d8"
        intensity={hemisphereIntensity}
      />
    </>
  );
}

export default EnvironmentLighting;
