import { useEffect, useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { MeshGroups } from "./ClickHandler";

interface OfficeModelProps {
  privacyMode: boolean;
  meetingOn: boolean;
  curtainPosition: number;
  onLoaded: () => void;
  onError?: () => void;
  onMeshesReady?: (groups: MeshGroups) => void; // 🆕
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isSafari = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

function OfficeModel({
  privacyMode,
  meetingOn,
  curtainPosition,
  onLoaded,
  onError,
  onMeshesReady, // 🆕
}: OfficeModelProps) {
  const doorGlassMeshRef = useRef<THREE.Mesh | null>(null);
  const screenMeshesRef = useRef<THREE.Mesh[]>([]);
  const curtainMeshRef = useRef<THREE.Mesh | null>(null);
  const curtainInitialY = useRef<number | null>(null);
  const isInitialized = useRef(false);
  const hasErrorOccurred = useRef(false);
  const loadStartTime = useRef<number>(Date.now());
  const loadTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("🔍 Device Info:", {
      isIOS: isIOS(),
      isSafari: isSafari(),
      userAgent: navigator.userAgent,
    });
  }, []);

  console.log("📦 Loading GLTF model...");
  const { scene } = useGLTF("/models/office.glb", true, true, (loader) => {
    console.log("📦 GLTF loader initialized");
    loader.manager.onError = (url) => {
      console.error("❌ GLTF Manager Error loading:", url);
      if (onError && !hasErrorOccurred.current) {
        hasErrorOccurred.current = true;
        onError();
      }
    };
  });

  if (scene) console.log("✅ GLTF scene loaded");

  console.log("🖼️ Loading texture...");
  const texture = useTexture("/models/office-texture.jpeg");

  if (texture) console.log("✅ Texture loaded");

  useEffect(() => {
    console.log("⏰ Setting up safety timeout (10s)...");
    loadTimeoutRef.current = window.setTimeout(() => {
      if (!isInitialized.current) {
        console.error("❌ TIMEOUT: Initialization took too long (10s)");
        if (onError && !hasErrorOccurred.current) {
          hasErrorOccurred.current = true;
          onError();
        }
      }
    }, 10000);

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [onError]);

  useEffect(() => {
    console.log("🚀 Main initialization effect running...", {
      isInitialized: isInitialized.current,
      hasScene: !!scene,
      hasTexture: !!texture,
    });

    if (isInitialized.current) return;
    if (!scene || !texture) return;

    try {
      console.log("⚙️ Configuring texture...");
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = isIOS() || isSafari() ? 4 : 16;
      texture.needsUpdate = true;

      let meshCount = 0;

      // 🆕 Reset mesh group arrays before traversal
      screenMeshesRef.current = [];

      console.log("🔍 Traversing scene for meshes...");
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const meshName = mesh.name?.toLowerCase() || "";
          meshCount++;

          // 🐛 DEBUG: log every mesh name so we can find the right keywords
          console.log(
            `🔷 Mesh [${meshCount}]: "${mesh.name}" → lowercase: "${meshName}"`,
          );

          // ── Categorise meshes ──────────────────────
          if (meshName.includes("door") && meshName.includes("glass")) {
            doorGlassMeshRef.current = mesh;
            console.log("✅ Door glass mesh found:", mesh.name);
          }

          // TV_Glass + Project_Glass both act as meeting screens
          if (
            meshName.includes("tv") ||
            meshName.includes("screen") ||
            meshName.includes("project")
          ) {
            screenMeshesRef.current.push(mesh);
            console.log("✅ Screen mesh found:", mesh.name);
          }

          if (
            meshName.includes("curtain") &&
            curtainInitialY.current === null
          ) {
            curtainMeshRef.current = mesh;
            curtainInitialY.current = mesh.position.y;
            console.log("✅ Curtain mesh found:", mesh.name);
          }

          // ── Apply materials ────────────────────────
          if (mesh.material) {
            // Pure glass surfaces (facade + door only, NOT project/tv screens)
            const isPureGlass =
              meshName.includes("glass") &&
              !meshName.includes("tv") &&
              !meshName.includes("project");

            if (isPureGlass) {
              mesh.material = new THREE.MeshBasicMaterial({
                color: 0xc8dce8,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                depthWrite: false,
              });
              mesh.renderOrder = 1;
              mesh.castShadow = false;
              mesh.receiveShadow = false;
            } else {
              const material = mesh.material as THREE.MeshStandardMaterial;
              material.map = texture;
              material.needsUpdate = true;
              material.transparent = false;
              material.opacity = 1.0;
              material.metalness = 1;
              material.roughness = 1;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          }
        }
      });

      console.log(`📊 Scene traversal complete: ${meshCount} meshes found`);

      isInitialized.current = true;

      // 🆕 Notify parent about ready mesh groups
      if (onMeshesReady) {
        onMeshesReady({
          curtain: curtainMeshRef.current,
          screens: screenMeshesRef.current,
          doorGlass: doorGlassMeshRef.current,
        });
        console.log("✅ onMeshesReady called");
      }

      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

      const loadTime = Date.now() - loadStartTime.current;
      console.log(`✅ Total load time: ${loadTime}ms`);

      setTimeout(() => {
        console.log("✅ Calling onLoaded callback");
        onLoaded();
      }, 500);
    } catch (error) {
      console.error("❌ Initialization error:", error);
      if (onError && !hasErrorOccurred.current) {
        hasErrorOccurred.current = true;
        onError();
      }
    }
  }, [scene, texture, onLoaded, onError, onMeshesReady]);

  // Privacy mode effect
  useEffect(() => {
    if (!doorGlassMeshRef.current) return;
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
  }, [privacyMode]);

  // Meeting screen effect
  useEffect(() => {
    if (screenMeshesRef.current.length === 0) return;
    screenMeshesRef.current.forEach((mesh) => {
      if (!mesh.material) return;
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        const m = mesh.material;
        m.color = new THREE.Color(meetingOn ? 0x00ff88 : 0x333333);
        m.opacity = meetingOn ? 0.8 : 0.3;
        m.needsUpdate = true;
      } else {
        const m = mesh.material as THREE.MeshStandardMaterial;
        m.emissive = new THREE.Color(meetingOn ? 0x00ff88 : 0x000000);
        m.emissiveIntensity = meetingOn ? 2.0 : 0;
        m.needsUpdate = true;
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
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [curtainPosition]);

  if (!scene) return null;

  return <primitive object={scene} />;
}

useGLTF.preload("/models/office.glb");
useTexture.preload("/models/office-texture.jpeg");

export default OfficeModel;

// import { useEffect, useRef } from "react";
// import { useGLTF, useTexture } from "@react-three/drei";
// import * as THREE from "three";
// import { MeshGroups } from "./ClickHandler";

// interface OfficeModelProps {
//   privacyMode: boolean;
//   meetingOn: boolean;
//   curtainPosition: number;
//   onLoaded: () => void;
//   onError?: () => void;
//   onMeshesReady?: (groups: MeshGroups) => void; // 🆕
// }

// const isIOS = () =>
//   /iPad|iPhone|iPod/.test(navigator.userAgent) ||
//   (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// const isSafari = () =>
//   /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// function OfficeModel({
//   privacyMode,
//   meetingOn,
//   curtainPosition,
//   onLoaded,
//   onError,
//   onMeshesReady, // 🆕
// }: OfficeModelProps) {
//   const doorGlassMeshRef = useRef<THREE.Mesh | null>(null);
//   const screenMeshesRef = useRef<THREE.Mesh[]>([]);
//   const lightMeshesRef = useRef<THREE.Mesh[]>([]); // 🆕
//   const curtainMeshRef = useRef<THREE.Mesh | null>(null);
//   const curtainInitialY = useRef<number | null>(null);
//   const isInitialized = useRef(false);
//   const hasErrorOccurred = useRef(false);
//   const loadStartTime = useRef<number>(Date.now());
//   const loadTimeoutRef = useRef<number | null>(null);

//   useEffect(() => {
//     console.log("🔍 Device Info:", {
//       isIOS: isIOS(),
//       isSafari: isSafari(),
//       userAgent: navigator.userAgent,
//     });
//   }, []);

//   console.log("📦 Loading GLTF model...");
//   const { scene } = useGLTF("/models/office.glb", true, true, (loader) => {
//     console.log("📦 GLTF loader initialized");
//     loader.manager.onError = (url) => {
//       console.error("❌ GLTF Manager Error loading:", url);
//       if (onError && !hasErrorOccurred.current) {
//         hasErrorOccurred.current = true;
//         onError();
//       }
//     };
//   });

//   if (scene) console.log("✅ GLTF scene loaded");

//   console.log("🖼️ Loading texture...");
//   const texture = useTexture("/models/office-texture.jpeg");

//   if (texture) console.log("✅ Texture loaded");

//   useEffect(() => {
//     console.log("⏰ Setting up safety timeout (10s)...");
//     loadTimeoutRef.current = window.setTimeout(() => {
//       if (!isInitialized.current) {
//         console.error("❌ TIMEOUT: Initialization took too long (10s)");
//         if (onError && !hasErrorOccurred.current) {
//           hasErrorOccurred.current = true;
//           onError();
//         }
//       }
//     }, 10000);

//     return () => {
//       if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
//     };
//   }, [onError]);

//   useEffect(() => {
//     console.log("🚀 Main initialization effect running...", {
//       isInitialized: isInitialized.current,
//       hasScene: !!scene,
//       hasTexture: !!texture,
//     });

//     if (isInitialized.current) return;
//     if (!scene || !texture) return;

//     try {
//       console.log("⚙️ Configuring texture...");
//       texture.flipY = false;
//       texture.colorSpace = THREE.SRGBColorSpace;
//       texture.anisotropy = isIOS() || isSafari() ? 4 : 16;
//       texture.needsUpdate = true;

//       let meshCount = 0;

//       // 🆕 Reset mesh group arrays before traversal
//       lightMeshesRef.current = [];
//       screenMeshesRef.current = [];

//       console.log("🔍 Traversing scene for meshes...");
//       scene.traverse((child) => {
//         if ((child as THREE.Mesh).isMesh) {
//           const mesh = child as THREE.Mesh;
//           const meshName = mesh.name?.toLowerCase() || "";
//           meshCount++;

//           // ── Categorise meshes ──────────────────────
//           if (meshName.includes("door") && meshName.includes("glass")) {
//             doorGlassMeshRef.current = mesh;
//             console.log("✅ Door glass mesh found:", mesh.name);
//           }

//           if (meshName.includes("screen") || meshName.includes("tv")) {
//             screenMeshesRef.current.push(mesh);
//             console.log("✅ Screen mesh found:", mesh.name);
//           }

//           if (meshName.includes("light")) {
//             lightMeshesRef.current.push(mesh); // 🆕
//             console.log("✅ Light mesh found:", mesh.name);
//           }

//           if (
//             meshName.includes("curtain") &&
//             curtainInitialY.current === null
//           ) {
//             curtainMeshRef.current = mesh;
//             curtainInitialY.current = mesh.position.y;
//             console.log("✅ Curtain mesh found:", mesh.name);
//           }

//           // ── Apply materials ────────────────────────
//           if (mesh.material) {
//             if (meshName.includes("glass")) {
//               mesh.material = new THREE.MeshBasicMaterial({
//                 color: 0xc8dce8,
//                 transparent: true,
//                 opacity: 0.3,
//                 side: THREE.DoubleSide,
//                 depthWrite: false,
//               });
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

//       console.log(`📊 Scene traversal complete: ${meshCount} meshes found`);

//       isInitialized.current = true;

//       // 🆕 Notify parent about ready mesh groups
//       if (onMeshesReady) {
//         onMeshesReady({
//           lights: lightMeshesRef.current,
//           curtain: curtainMeshRef.current,
//           screens: screenMeshesRef.current,
//           doorGlass: doorGlassMeshRef.current,
//         });
//         console.log("✅ onMeshesReady called");
//       }

//       if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

//       const loadTime = Date.now() - loadStartTime.current;
//       console.log(`✅ Total load time: ${loadTime}ms`);

//       setTimeout(() => {
//         console.log("✅ Calling onLoaded callback");
//         onLoaded();
//       }, 500);
//     } catch (error) {
//       console.error("❌ Initialization error:", error);
//       if (onError && !hasErrorOccurred.current) {
//         hasErrorOccurred.current = true;
//         onError();
//       }
//     }
//   }, [scene, texture, onLoaded, onError, onMeshesReady]);

//   // Privacy mode effect
//   useEffect(() => {
//     if (!doorGlassMeshRef.current) return;
//     const material = doorGlassMeshRef.current
//       .material as THREE.MeshBasicMaterial;
//     if (privacyMode) {
//       material.color = new THREE.Color(0xfcfcfc);
//       material.opacity = 0.95;
//     } else {
//       material.color = new THREE.Color(0xc8dce8);
//       material.opacity = 0.3;
//     }
//     material.needsUpdate = true;
//   }, [privacyMode]);

//   // Meeting screen effect
//   useEffect(() => {
//     if (screenMeshesRef.current.length === 0) return;
//     screenMeshesRef.current.forEach((mesh) => {
//       if (!mesh.material) return;
//       if (mesh.material instanceof THREE.MeshBasicMaterial) {
//         const m = mesh.material;
//         m.color = new THREE.Color(meetingOn ? 0x00ff88 : 0x333333);
//         m.opacity = meetingOn ? 0.8 : 0.3;
//         m.needsUpdate = true;
//       } else {
//         const m = mesh.material as THREE.MeshStandardMaterial;
//         m.emissive = new THREE.Color(meetingOn ? 0x00ff88 : 0x000000);
//         m.emissiveIntensity = meetingOn ? 2.0 : 0;
//         m.needsUpdate = true;
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
//       if (animationFrameId) cancelAnimationFrame(animationFrameId);
//     };
//   }, [curtainPosition]);

//   if (!scene) return null;

//   return <primitive object={scene} />;
// }

// useGLTF.preload("/models/office.glb");
// useTexture.preload("/models/office-texture.jpeg");

// export default OfficeModel;
