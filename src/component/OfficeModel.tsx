import { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface OfficeModelProps {
  privacyMode: boolean;
  meetingOn: boolean;
  curtainPosition: number;
  onLoaded: () => void;
  onError?: () => void;
}

function OfficeModel({
  privacyMode,
  meetingOn,
  curtainPosition,
  onLoaded,
  onError,
}: OfficeModelProps) {
  const doorGlassMeshRef = useRef<THREE.Mesh | null>(null);
  const screenMeshesRef = useRef<THREE.Mesh[]>([]);
  const curtainMeshRef = useRef<THREE.Mesh | null>(null);
  const curtainInitialY = useRef<number | null>(null);
  const isInitialized = useRef(false);
  const hasErrorOccurred = useRef(false);
  const loadStartTime = useRef<number>(Date.now());
  const loadTimeoutRef = useRef<number | null>(null);

  // ✅ GLTF loading with combined model + texture (OFFICEMaterial-v2)
  const { scene } = useGLTF(
    "/models/OFFICEMaterial-v2.glb",
    true,
    true,
    (loader) => {
      loader.manager.onError = (url) => {
        if (onError && !hasErrorOccurred.current) {
          hasErrorOccurred.current = true;
          onError();
        }
      };
    },
  );

  // 🔍 Safety timeout - if initialization takes too long, trigger error
  useEffect(() => {
    loadTimeoutRef.current = window.setTimeout(() => {
      if (!isInitialized.current) {
        if (onError && !hasErrorOccurred.current) {
          hasErrorOccurred.current = true;
          onError();
        }
      }
    }, 10000); // 10 second timeout

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [onError]);

  // ✅ Main initialization effect
  useEffect(() => {
    if (isInitialized.current) {
      return;
    }

    // ✅ Check if resources loaded successfully
    if (!scene) {
      if (onError && !hasErrorOccurred.current) {
        hasErrorOccurred.current = true;
        onError();
      }
      return;
    }

    try {
      let meshCount = 0;

      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const meshName = mesh.name?.toLowerCase() || "";
          meshCount++;

          // Identify special meshes
          if (meshName.includes("door") && meshName.includes("glass")) {
            doorGlassMeshRef.current = mesh;
          }

          if (meshName.includes("screen") || meshName.includes("tv")) {
            screenMeshesRef.current.push(mesh);
          }

          if (
            meshName.includes("curtain") &&
            curtainInitialY.current === null
          ) {
            curtainMeshRef.current = mesh;
            curtainInitialY.current = mesh.position.y;
          }

          // Apply material configurations
          if (mesh.material) {
            if (meshName.includes("glass")) {
              const glassColor = 0xc8dce8;

              const basicMaterial = new THREE.MeshBasicMaterial({
                color: glassColor,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                depthWrite: false,
              });

              mesh.material = basicMaterial;
              mesh.renderOrder = 1;
              mesh.castShadow = false;
              mesh.receiveShadow = false;
            } else {
              // For non-glass materials, keep existing material but enhance it
              const material = mesh.material as THREE.MeshStandardMaterial;

              // The texture is already embedded in OFFICEMaterial-v2.glb
              // So we just need to configure material properties
              material.needsUpdate = true;
              material.transparent = false;
              material.opacity = 1.0;

              // Keep default metalness/roughness if they exist, otherwise set defaults
              if (material.metalness === undefined) {
                material.metalness = 0.1;
              }
              if (material.roughness === undefined) {
                material.roughness = 0.8;
              }

              // Add emissive for lights
              if (meshName.includes("light")) {
                material.emissive = new THREE.Color(0xfff8e1);
                material.emissiveIntensity = 0.8;
              }

              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          }
        }
      });

      isInitialized.current = true;

      // Clear the safety timeout since we succeeded
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }

      // ✅ Call onLoaded after successful initialization
      setTimeout(() => {
        onLoaded();
      }, 500);
    } catch (error) {
      if (onError && !hasErrorOccurred.current) {
        hasErrorOccurred.current = true;
        onError();
      }
    }
  }, [scene, onLoaded, onError]);

  // Privacy mode effect
  useEffect(() => {
    if (doorGlassMeshRef.current && doorGlassMeshRef.current.material) {
      const material = doorGlassMeshRef.current
        .material as THREE.MeshBasicMaterial;

      if (privacyMode) {
        material.color = new THREE.Color(0xfcfcfc);
        material.opacity = 0.95;
      } else {
        material.color = new THREE.Color(0xc8dce8);
        material.opacity = 0.3;
      }

      material.needsUpdate = true;
    }
  }, [privacyMode]);

  // Meeting screen effect
  useEffect(() => {
    screenMeshesRef.current.forEach((mesh) => {
      if (mesh.material) {
        const isBasicMaterial =
          mesh.material instanceof THREE.MeshBasicMaterial;

        if (isBasicMaterial) {
          const material = mesh.material as THREE.MeshBasicMaterial;
          if (meetingOn) {
            material.color = new THREE.Color(0x00ff88);
            material.opacity = 0.8;
          } else {
            material.color = new THREE.Color(0x333333);
            material.opacity = 0.3;
          }
          material.needsUpdate = true;
        } else {
          const material = mesh.material as THREE.MeshStandardMaterial;
          if (meetingOn) {
            material.emissive = new THREE.Color(0x00ff88);
            material.emissiveIntensity = 2.0;
          } else {
            material.emissive = new THREE.Color(0x000000);
            material.emissiveIntensity = 0;
          }
          material.needsUpdate = true;
        }
      }
    });
  }, [meetingOn]);

  // Curtain animation effect
  useEffect(() => {
    if (!curtainMeshRef.current || curtainInitialY.current === null) return;

    const maxRaiseDistance = 3.0;
    const targetY =
      curtainInitialY.current + (curtainPosition / 100) * maxRaiseDistance;

    let animationFrameId: number;

    const animate = () => {
      if (!curtainMeshRef.current || curtainInitialY.current === null) return;

      const currentY = curtainMeshRef.current.position.y;
      const diff = targetY - currentY;

      if (Math.abs(diff) < 0.001) {
        curtainMeshRef.current.position.y = targetY;
        return;
      }

      curtainMeshRef.current.position.y = THREE.MathUtils.lerp(
        currentY,
        targetY,
        0.1,
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [curtainPosition]);

  // ✅ Add safety check before rendering
  if (!scene) {
    return null;
  }

  return <primitive object={scene} />;
}

// ✅ Preload the combined model file
useGLTF.preload("/models/OFFICEMaterial-v2.glb");

export default OfficeModel;

// import { useEffect, useRef } from "react";
// import { useGLTF, useTexture } from "@react-three/drei";
// import * as THREE from "three";

// interface OfficeModelProps {
//   privacyMode: boolean;
//   meetingOn: boolean;
//   curtainPosition: number;
//   onLoaded: () => void;
//   onError?: () => void;
// }

// function OfficeModel({
//   privacyMode,
//   meetingOn,
//   curtainPosition,
//   onLoaded,
//   onError,
// }: OfficeModelProps) {
//   const doorGlassMeshRef = useRef<THREE.Mesh | null>(null);
//   const screenMeshesRef = useRef<THREE.Mesh[]>([]);
//   const curtainMeshRef = useRef<THREE.Mesh | null>(null);
//   const curtainInitialY = useRef<number | null>(null);
//   const isInitialized = useRef(false);
//   const hasErrorOccurred = useRef(false);
//   const loadStartTime = useRef<number>(Date.now());
//   const loadTimeoutRef = useRef<number | null>(null);

//   // ✅ GLTF loading with error handling
//   const { scene } = useGLTF("/models/office.glb", true, true, (loader) => {
//     loader.manager.onError = (url) => {
//       if (onError && !hasErrorOccurred.current) {
//         hasErrorOccurred.current = true;
//         onError();
//       }
//     };
//   });

//   // ✅ Texture loading
//   const texture = useTexture("/models/office-texture.webp");

//   // 🔍 Safety timeout - if initialization takes too long, trigger error
//   useEffect(() => {
//     loadTimeoutRef.current = window.setTimeout(() => {
//       if (!isInitialized.current) {
//         if (onError && !hasErrorOccurred.current) {
//           hasErrorOccurred.current = true;
//           onError();
//         }
//       }
//     }, 10000); // 10 second timeout

//     return () => {
//       if (loadTimeoutRef.current) {
//         clearTimeout(loadTimeoutRef.current);
//       }
//     };
//   }, [onError]);

//   // ✅ Main initialization effect
//   useEffect(() => {
//     if (isInitialized.current) {
//       return;
//     }

//     // ✅ Check if resources loaded successfully
//     if (!scene) {
//       if (onError && !hasErrorOccurred.current) {
//         hasErrorOccurred.current = true;
//         onError();
//       }
//       return;
//     }

//     if (!texture) {
//       if (onError && !hasErrorOccurred.current) {
//         hasErrorOccurred.current = true;
//         onError();
//       }
//       return;
//     }

//     try {
//       texture.flipY = false;
//       texture.colorSpace = THREE.SRGBColorSpace;
//       texture.anisotropy = 16;
//       texture.needsUpdate = true;

//       let meshCount = 0;

//       scene.traverse((child) => {
//         if ((child as THREE.Mesh).isMesh) {
//           const mesh = child as THREE.Mesh;
//           const meshName = mesh.name?.toLowerCase() || "";
//           meshCount++;

//           if (meshName.includes("door") && meshName.includes("glass")) {
//             doorGlassMeshRef.current = mesh;
//           }

//           if (meshName.includes("screen") || meshName.includes("tv")) {
//             screenMeshesRef.current.push(mesh);
//           }

//           if (
//             meshName.includes("curtain") &&
//             curtainInitialY.current === null
//           ) {
//             curtainMeshRef.current = mesh;
//             curtainInitialY.current = mesh.position.y;
//           }

//           if (mesh.material) {
//             const meshName = mesh.name?.toLowerCase() || "";

//             if (meshName.includes("glass")) {
//               const glassColor = 0xc8dce8;

//               const basicMaterial = new THREE.MeshBasicMaterial({
//                 color: glassColor,
//                 transparent: true,
//                 opacity: 0.3,
//                 side: THREE.DoubleSide,
//                 depthWrite: false,
//               });

//               mesh.material = basicMaterial;
//               mesh.renderOrder = 1;
//               mesh.castShadow = false;
//               mesh.receiveShadow = false;
//             } else {
//               const material = mesh.material as THREE.MeshStandardMaterial;

//               material.map = texture;
//               material.needsUpdate = true;
//               material.transparent = false;
//               material.opacity = 1.0;
//               material.metalness = 1;
//               material.roughness = 1;

//               if (meshName.includes("light")) {
//                 material.emissive = new THREE.Color(0xfff8e1);
//                 material.emissiveIntensity = 0.8;
//                 material.emissiveMap = texture;
//               }

//               mesh.castShadow = true;
//               mesh.receiveShadow = true;
//             }
//           }
//         }
//       });

//       isInitialized.current = true;

//       // Clear the safety timeout since we succeeded
//       if (loadTimeoutRef.current) {
//         clearTimeout(loadTimeoutRef.current);
//       }

//       // ✅ Call onLoaded after successful initialization
//       setTimeout(() => {
//         onLoaded();
//       }, 500);
//     } catch (error) {
//       if (onError && !hasErrorOccurred.current) {
//         hasErrorOccurred.current = true;
//         onError();
//       }
//     }
//   }, [scene, texture, onLoaded, onError]);

//   // Privacy mode effect
//   useEffect(() => {
//     if (doorGlassMeshRef.current && doorGlassMeshRef.current.material) {
//       const material = doorGlassMeshRef.current
//         .material as THREE.MeshBasicMaterial;

//       if (privacyMode) {
//         material.color = new THREE.Color(0xfcfcfc);
//         material.opacity = 0.95;
//       } else {
//         material.color = new THREE.Color(0xc8dce8);
//         material.opacity = 0.3;
//       }

//       material.needsUpdate = true;
//     }
//   }, [privacyMode]);

//   // Meeting screen effect
//   useEffect(() => {
//     screenMeshesRef.current.forEach((mesh) => {
//       if (mesh.material) {
//         const isBasicMaterial =
//           mesh.material instanceof THREE.MeshBasicMaterial;

//         if (isBasicMaterial) {
//           const material = mesh.material as THREE.MeshBasicMaterial;
//           if (meetingOn) {
//             material.color = new THREE.Color(0x00ff88);
//             material.opacity = 0.8;
//           } else {
//             material.color = new THREE.Color(0x333333);
//             material.opacity = 0.3;
//           }
//           material.needsUpdate = true;
//         } else {
//           const material = mesh.material as THREE.MeshStandardMaterial;
//           if (meetingOn) {
//             material.emissive = new THREE.Color(0x00ff88);
//             material.emissiveIntensity = 2.0;
//           } else {
//             material.emissive = new THREE.Color(0x000000);
//             material.emissiveIntensity = 0;
//           }
//           material.needsUpdate = true;
//         }
//       }
//     });
//   }, [meetingOn]);

//   // Curtain animation effect
//   useEffect(() => {
//     if (!curtainMeshRef.current || curtainInitialY.current === null) return;

//     const maxRaiseDistance = 3.0;
//     const targetY =
//       curtainInitialY.current + (curtainPosition / 100) * maxRaiseDistance;

//     let animationFrameId: number;

//     const animate = () => {
//       if (!curtainMeshRef.current || curtainInitialY.current === null) return;

//       const currentY = curtainMeshRef.current.position.y;
//       const diff = targetY - currentY;

//       if (Math.abs(diff) < 0.001) {
//         curtainMeshRef.current.position.y = targetY;
//         return;
//       }

//       curtainMeshRef.current.position.y = THREE.MathUtils.lerp(
//         currentY,
//         targetY,
//         0.1,
//       );

//       animationFrameId = requestAnimationFrame(animate);
//     };

//     animate();

//     return () => {
//       if (animationFrameId) {
//         cancelAnimationFrame(animationFrameId);
//       }
//     };
//   }, [curtainPosition]);

//   // ✅ Add safety check before rendering
//   if (!scene) {
//     return null;
//   }

//   return <primitive object={scene} />;
// }

// useGLTF.preload("/models/office.glb");
// useTexture.preload("/models/office-texture.webp");

// export default OfficeModel;
