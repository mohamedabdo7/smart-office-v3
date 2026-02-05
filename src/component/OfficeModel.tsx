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
  const loadTimeoutRef = useRef<number | null>(null);

  // 📱 Detect if running in WebView
  const isWebView = (() => {
    const ua = navigator.userAgent;
    // Check for Flutter WebView or any WebView
    return (
      ua.includes("Flutter") ||
      /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua) ||
      ua.includes("wv")
    );
  })();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isIOSWebView = isIOS && isWebView;

  useEffect(() => {
    console.log("📱 Environment:", {
      isIOS,
      isWebView,
      isIOSWebView,
      userAgent: navigator.userAgent,
    });
  }, []);

  // ✅ GLTF loading with error handling
  const { scene } = useGLTF(
    "/models/OFFICEMaterial-v2.glb",
    true,
    true,
    (loader) => {
      loader.manager.onStart = (url, itemsLoaded, itemsTotal) => {
        console.log(
          `📦 Loading started: ${itemsLoaded}/${itemsTotal} - ${url}`,
        );
      };

      loader.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
        const progress = Math.round((itemsLoaded / itemsTotal) * 100);
        console.log(
          `⏳ Loading progress: ${progress}% - ${itemsLoaded}/${itemsTotal}`,
        );
      };

      loader.manager.onLoad = () => {
        console.log("✅ All resources loaded");
      };

      loader.manager.onError = (url) => {
        console.error("❌ Model loading error:", url);
        if (onError && !hasErrorOccurred.current) {
          hasErrorOccurred.current = true;
          onError();
        }
      };
    },
  );

  // 🔍 Extended timeout for WebView
  useEffect(() => {
    // WebView needs MUCH longer timeout
    const timeout = isIOSWebView ? 60000 : isIOS ? 20000 : 10000;

    console.log(`⏱️ Setting timeout: ${timeout / 1000}s`);

    loadTimeoutRef.current = window.setTimeout(() => {
      if (!isInitialized.current) {
        console.error("⏱️ Loading timeout reached");
        if (onError && !hasErrorOccurred.current) {
          hasErrorOccurred.current = true;
          onError();
        }
      }
    }, timeout);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [onError, isIOS, isIOSWebView]);

  // ✅ Main initialization effect
  useEffect(() => {
    if (isInitialized.current) {
      return;
    }

    if (!scene) {
      console.warn("⚠️ Scene not loaded yet");
      return;
    }

    try {
      console.log("🔧 Initializing scene for WebView...");
      let meshCount = 0;
      let materialCount = 0;

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

          // 📱 WEBVIEW AGGRESSIVE OPTIMIZATIONS
          if (mesh.material) {
            materialCount++;

            if (meshName.includes("glass")) {
              // Use simplest possible material for glass
              const basicMaterial = new THREE.MeshBasicMaterial({
                color: 0xc8dce8,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                depthWrite: false,
              });

              // Dispose old material
              if (mesh.material) {
                (mesh.material as THREE.Material).dispose();
              }

              mesh.material = basicMaterial;
              mesh.renderOrder = 1;
              mesh.castShadow = false;
              mesh.receiveShadow = false;
            } else {
              // For WebView: Convert everything to MeshBasicMaterial if needed
              if (
                isIOSWebView &&
                mesh.material instanceof THREE.MeshStandardMaterial
              ) {
                const oldMaterial = mesh.material as THREE.MeshStandardMaterial;

                // Convert to Basic Material for better performance
                const basicMaterial = new THREE.MeshBasicMaterial({
                  map: oldMaterial.map,
                  color: oldMaterial.color,
                  transparent: oldMaterial.transparent,
                  opacity: oldMaterial.opacity,
                });

                // Dispose old material
                oldMaterial.dispose();
                mesh.material = basicMaterial;

                console.log(`🔄 Converted ${meshName} to MeshBasicMaterial`);
              } else {
                const material = mesh.material as THREE.MeshStandardMaterial;
                material.needsUpdate = true;
                material.transparent = false;
                material.opacity = 1.0;

                // Simplify material properties for WebView
                if (isIOSWebView) {
                  material.metalness = 0;
                  material.roughness = 1;
                  material.envMapIntensity = 0;
                } else {
                  material.metalness = material.metalness ?? 0.1;
                  material.roughness = material.roughness ?? 0.8;
                }

                // Add emissive for lights
                if (meshName.includes("light")) {
                  material.emissive = new THREE.Color(0xfff8e1);
                  material.emissiveIntensity = isIOSWebView ? 0.5 : 0.8;
                }

                // Disable shadows completely in WebView
                mesh.castShadow = false;
                mesh.receiveShadow = false;
              }
            }
          }

          // WebView: Aggressive culling
          mesh.frustumCulled = true;

          // WebView: Disable matrix auto-update for static objects
          if (!meshName.includes("curtain")) {
            mesh.matrixAutoUpdate = false;
            mesh.updateMatrix();
          }
        }
      });

      console.log(
        `✅ Initialized ${meshCount} meshes, ${materialCount} materials`,
      );
      console.log(`📊 Memory usage:`, (performance as any).memory);

      isInitialized.current = true;

      // Clear the safety timeout
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }

      // Longer delay for WebView to ensure everything is ready
      const loadDelay = isIOSWebView ? 1500 : isIOS ? 800 : 500;
      setTimeout(() => {
        console.log("🎉 Calling onLoaded");
        onLoaded();
      }, loadDelay);
    } catch (error) {
      console.error("❌ Initialization error:", error);
      if (onError && !hasErrorOccurred.current) {
        hasErrorOccurred.current = true;
        onError();
      }
    }
  }, [scene, onLoaded, onError, isIOS, isIOSWebView]);

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
        const material = mesh.material as THREE.MeshBasicMaterial;

        if (meetingOn) {
          material.color = new THREE.Color(0x00ff88);
          material.opacity = 0.8;
          if ("emissive" in material) {
            (material as any).emissive = new THREE.Color(0x00ff88);
            (material as any).emissiveIntensity = 1.0;
          }
        } else {
          material.color = new THREE.Color(0x333333);
          material.opacity = 0.3;
          if ("emissive" in material) {
            (material as any).emissive = new THREE.Color(0x000000);
            (material as any).emissiveIntensity = 0;
          }
        }

        material.needsUpdate = true;
      }
    });
  }, [meetingOn]);

  // Curtain animation effect - OPTIMIZED for WebView
  useEffect(() => {
    if (!curtainMeshRef.current || curtainInitialY.current === null) return;

    const maxRaiseDistance = 3.0;
    const targetY =
      curtainInitialY.current + (curtainPosition / 100) * maxRaiseDistance;

    let animationFrameId: number;
    let lastUpdateTime = Date.now();

    // WebView: Throttle animation updates
    const updateInterval = isIOSWebView ? 50 : 16; // 20fps vs 60fps

    const animate = () => {
      if (!curtainMeshRef.current || curtainInitialY.current === null) return;

      const now = Date.now();
      const deltaTime = now - lastUpdateTime;

      // Throttle updates for better WebView performance
      if (deltaTime >= updateInterval) {
        const currentY = curtainMeshRef.current.position.y;
        const diff = targetY - currentY;

        if (Math.abs(diff) < 0.001) {
          curtainMeshRef.current.position.y = targetY;
          return;
        }

        curtainMeshRef.current.position.y = THREE.MathUtils.lerp(
          currentY,
          targetY,
          isIOSWebView ? 0.15 : 0.1, // Faster interpolation for lower fps
        );

        lastUpdateTime = now;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [curtainPosition, isIOSWebView]);

  // 📱 AGGRESSIVE cleanup for WebView
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up scene...");
      if (scene) {
        scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;

            if (mesh.geometry) {
              mesh.geometry.dispose();
            }

            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((material) => {
                  if (material.map) material.map.dispose();
                  if ("emissiveMap" in material && material.emissiveMap) {
                    material.emissiveMap.dispose();
                  }
                  material.dispose();
                });
              } else {
                if (mesh.material.map) mesh.material.map.dispose();
                if (
                  "emissiveMap" in mesh.material &&
                  mesh.material.emissiveMap
                ) {
                  (mesh.material as any).emissiveMap.dispose();
                }
                mesh.material.dispose();
              }
            }
          }
        });
      }
      console.log("✅ Cleanup complete");
    };
  }, [scene]);

  if (!scene) {
    return null;
  }

  return <primitive object={scene} />;
}

// ✅ Preload
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
