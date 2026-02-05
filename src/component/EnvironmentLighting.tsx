interface EnvironmentLightingProps {
  lightsBrightness: number; // 0-100
}

function EnvironmentLighting({ lightsBrightness }: EnvironmentLightingProps) {
  // Calculate intensity based on brightness percentage
  const brightness = lightsBrightness / 100; // 0.0 to 1.0

  // Adjust intensities based on brightness
  const ambientIntensity = 1.5 * brightness;
  const pointIntensity = 2 * brightness;
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

// interface EnvironmentLightingProps {
//   lightsOn: boolean;
// }

// function EnvironmentLighting({ lightsOn }: EnvironmentLightingProps) {
//   // Adjust intensities based on lights state
//   const ambientIntensity = lightsOn ? 1.5 : 0.3;
//   const pointIntensity = lightsOn ? 18 : 0;
//   const hemisphereIntensity = lightsOn ? 0.7 : 0.2;

//   return (
//     <>
//       {/* Ambient lighting */}
//       <ambientLight intensity={ambientIntensity} color="#fff8e1" />

//       {/* Grid of point lights */}

//       {/* Front Left */}
//       <pointLight
//         position={[2, 2.0, -8]}
//         intensity={pointIntensity}
//         color="#fff8e1"
//         distance={14}
//         decay={2}
//       />

//       {/* Front Right */}
//       <pointLight
//         position={[7, 2.0, -8]}
//         intensity={pointIntensity}
//         color="#fff8e1"
//         distance={14}
//         decay={2}
//       />

//       {/* Middle Left */}
//       <pointLight
//         position={[2, 2.0, -12]}
//         intensity={pointIntensity}
//         color="#fff8e1"
//         distance={14}
//         decay={2}
//       />

//       {/* Middle Right */}
//       <pointLight
//         position={[7, 2.0, -12]}
//         intensity={pointIntensity}
//         color="#fff8e1"
//         distance={14}
//         decay={2}
//       />

//       {/* Back Left */}
//       <pointLight
//         position={[2, 2.0, -16]}
//         intensity={pointIntensity}
//         color="#fff8e1"
//         distance={14}
//         decay={2}
//       />

//       {/* Back Right */}
//       <pointLight
//         position={[7, 2.0, -16]}
//         intensity={pointIntensity}
//         color="#fff8e1"
//         distance={14}
//         decay={2}
//       />

//       {/* Hemisphere for ambient bounce */}
//       <hemisphereLight
//         color="#ffffff"
//         groundColor="#d8d8d8"
//         intensity={hemisphereIntensity}
//       />
//     </>
//   );
// }

// export default EnvironmentLighting;

// function EnvironmentLighting() {
//   return (
//     <>
//       {/* Moderate ambient - base lighting */}
//       <ambientLight intensity={10.5} color="#fff8f0" />

//       {/* Grid of point lights - well distributed for even coverage */}

//       {/* Front Left */}
//       <pointLight
//         position={[2, 2.0, -8]}
//         intensity={20}
//         color="#fff8e1"
//         distance={14}
//         decay={2}
//       />

//       {/* Front Right */}
//       <pointLight
//         position={[7, 2.0, -8]}
//         intensity={20}
//         color="#fff8e1"
//         distance={14}
//         decay={2}
//       />

//       {/* Middle Left */}
//       <pointLight
//         position={[2, 2.0, -12]}
//         intensity={20}
//         color="#fff8e1"
//         distance={14}
//         decay={2}
//       />

//       {/* Middle Right */}
//       <pointLight
//         position={[7, 2.0, -12]}
//         intensity={20}
//         color="#fff8e1"
//         distance={14}
//         decay={2}
//       />

//       {/* Back Left */}
//       <pointLight
//         position={[2, 2.0, -16]}
//         intensity={20}
//         color="#fff8e1"
//         distance={14}
//         decay={2}
//       />

//       {/* Back Right */}
//       <pointLight
//         position={[7, 2.0, -16]}
//         intensity={20}
//         color="#fff8e1"
//         distance={14}
//         decay={2}
//       />

//       {/* Hemisphere for ambient bounce */}
//       <hemisphereLight color="#ffffff" groundColor="#d8d8d8" intensity={0.7} />
//     </>
//   );
// }

// export default EnvironmentLighting;

// function EnvironmentLighting() {
//   return (
//     <>
//       {/* Base ambient - moderate for office */}
//       <ambientLight intensity={1.0} color="#ffffff" />

//       {/* Natural sunlight from windows */}
//       <directionalLight
//         position={[22, 28, 25]}
//         intensity={5.8}
//         color="#fffbf0"
//         castShadow
//         shadow-mapSize-width={2048}
//         shadow-mapSize-height={2048}
//         shadow-camera-left={-15}
//         shadow-camera-right={15}
//         shadow-camera-top={15}
//         shadow-camera-bottom={-15}
//         shadow-camera-near={1}
//         shadow-camera-far={50}
//         shadow-bias={-0.0001}
//       />

//       {/* Sky light - soft blue from outside */}
//       <directionalLight
//         position={[-8, 6, -12]}
//         intensity={5.8}
//         color="#e8f4ff"
//       />

//       {/* Ceiling point lights - distributed like real office lighting */}
//       {/* Front area */}
//       <pointLight
//         position={[2, 3.2, -8]}
//         intensity={5.8}
//         color="#fff8e6"
//         distance={10}
//         decay={2}
//       />

//       <pointLight
//         position={[6, 3.2, -8]}
//         intensity={1.8}
//         color="#fff8e6"
//         distance={10}
//         decay={2}
//       />

//       {/* Middle area */}
//       <pointLight
//         position={[2, 3.2, -12]}
//         intensity={1.8}
//         color="#fff8e6"
//         distance={10}
//         decay={2}
//       />

//       <pointLight
//         position={[6, 3.2, -12]}
//         intensity={1.8}
//         color="#fff8e6"
//         distance={10}
//         decay={2}
//       />

//       {/* Back area */}
//       <pointLight
//         position={[4, 3.2, -16]}
//         intensity={1.8}
//         color="#fff8e6"
//         distance={10}
//         decay={2}
//       />

//       {/* Hemisphere - sky bounce */}
//       <hemisphereLight color="#ffffff" groundColor="#cccccc" intensity={0.6} />
//     </>
//   );
// }

// export default EnvironmentLighting;

// function EnvironmentLighting() {
//   return (
//     <>
//       {/* Strong ambient base */}
//       <ambientLight intensity={2.0} color="#ffffff" />

//       {/* CORNER 1: Front-Left */}
//       <pointLight
//         position={[1, 2.0, -6]}
//         intensity={4.0}
//         color="#fff8f0"
//         distance={15}
//         decay={2}
//       />
//       <mesh position={[1, 2.0, -6]}>
//         <boxGeometry args={[0.4, 0.4, 0.4]} />
//         <meshBasicMaterial color="#ff0000" />
//       </mesh>

//       {/* CORNER 2: Front-Right */}
//       <pointLight
//         position={[8, 2.0, -6]}
//         intensity={4.0}
//         color="#fff8f0"
//         distance={15}
//         decay={2}
//       />
//       <mesh position={[8, 2.0, -6]}>
//         <boxGeometry args={[0.4, 0.4, 0.4]} />
//         <meshBasicMaterial color="#00ff00" />
//       </mesh>

//       {/* CORNER 3: Back-Left */}
//       <pointLight
//         position={[1, 2.0, -17]}
//         intensity={4.0}
//         color="#fff8f0"
//         distance={15}
//         decay={2}
//       />
//       <mesh position={[1, 2.0, -17]}>
//         <boxGeometry args={[0.4, 0.4, 0.4]} />
//         <meshBasicMaterial color="#0000ff" />
//       </mesh>

//       {/* CORNER 4: Back-Right */}
//       <pointLight
//         position={[8, 2.0, -17]}
//         intensity={4.0}
//         color="#fff8f0"
//         distance={15}
//         decay={2}
//       />
//       <mesh position={[8, 2.0, -17]}>
//         <boxGeometry args={[0.4, 0.4, 0.4]} />
//         <meshBasicMaterial color="#ffff00" />
//       </mesh>

//       {/* CENTER: Middle of room */}
//       <pointLight
//         position={[4.5, 2.0, -11.5]}
//         intensity={5.0}
//         color="#ffffff"
//         distance={18}
//         decay={2}
//       />
//       <mesh position={[1.5, 2.0, -12]}>
//         <boxGeometry args={[0.5, 0.5, 0.5]} />
//         <meshBasicMaterial color="#ff00ff" />
//       </mesh>

//       {/* Main directional light for shadows */}
//       <directionalLight
//         position={[10, 8, -8]}
//         intensity={2.5}
//         color="#fffbf0"
//         castShadow
//         shadow-mapSize-width={2048}
//         shadow-mapSize-height={2048}
//         shadow-camera-left={-15}
//         shadow-camera-right={15}
//         shadow-camera-top={15}
//         shadow-camera-bottom={-15}
//         shadow-camera-near={1}
//         shadow-camera-far={50}
//         shadow-bias={-0.0001}
//       />

//       {/* Hemisphere for ambient bounce */}
//       <hemisphereLight color="#ffffff" groundColor="#cccccc" intensity={1.5} />
//     </>
//   );
// }

// export default EnvironmentLighting;
