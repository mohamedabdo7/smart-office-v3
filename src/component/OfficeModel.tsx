import { useEffect, useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

interface OfficeModelProps {
  privacyMode: boolean;
  meetingOn: boolean;
  curtainPosition: number;
  onLoaded: () => void;
  onError?: () => void;
}

// 🔍 Helper function to detect iOS
const isIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

// 🔍 Helper function to detect Safari
const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

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

  // 🔍 Log device/browser info once
  useEffect(() => {
    console.log("🔍 Device Info:", {
      isIOS: isIOS(),
      isSafari: isSafari(),
      userAgent: navigator.userAgent,
    });
  }, []);

  // ✅ GLTF loading - MUST be at top level, no try-catch around hooks!
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

  if (scene) {
    console.log("✅ GLTF scene loaded");
  }

  // ✅ Texture loading - MUST be at top level, no try-catch around hooks!
  console.log("🖼️ Loading texture...");
  const texture = useTexture("/models/office-texture.jpeg");

  if (texture) {
    console.log("✅ Texture loaded");
  }

  // 🔍 Safety timeout - if initialization takes too long, trigger error
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
    }, 10000); // 10 second timeout

    return () => {
      if (loadTimeoutRef.current) {
        console.log("⏰ Clearing safety timeout");
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [onError]);

  // ✅ Main initialization effect
  useEffect(() => {
    console.log("🚀 Main initialization effect running...", {
      isInitialized: isInitialized.current,
      hasScene: !!scene,
      hasTexture: !!texture,
    });

    if (isInitialized.current) {
      console.log("⏭️ Already initialized, skipping...");
      return;
    }

    // ✅ Check if resources loaded successfully
    if (!scene) {
      console.warn("⚠️ Scene not ready yet...");
      return;
    }

    if (!texture) {
      console.warn("⚠️ Texture not ready yet...");
      return;
    }

    try {
      console.log("⚙️ Configuring texture...");
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;

      // 🔍 iOS/Safari specific: Use lower anisotropy
      const maxAnisotropy = isIOS() || isSafari() ? 4 : 16;
      texture.anisotropy = maxAnisotropy;
      console.log(`⚙️ Set anisotropy to ${maxAnisotropy}`);

      texture.needsUpdate = true;
      console.log("✅ Texture configured");

      let meshCount = 0;

      console.log("🔍 Traversing scene for meshes...");
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const meshName = mesh.name?.toLowerCase() || "";
          meshCount++;

          if (meshName.includes("door") && meshName.includes("glass")) {
            doorGlassMeshRef.current = mesh;
            console.log("✅ Door glass mesh found");
          }

          if (meshName.includes("screen") || meshName.includes("tv")) {
            screenMeshesRef.current.push(mesh);
            console.log("✅ Screen mesh found");
          }

          if (
            meshName.includes("curtain") &&
            curtainInitialY.current === null
          ) {
            curtainMeshRef.current = mesh;
            curtainInitialY.current = mesh.position.y;
            console.log("✅ Curtain mesh found");
          }

          if (mesh.material) {
            const meshName = mesh.name?.toLowerCase() || "";

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
              const material = mesh.material as THREE.MeshStandardMaterial;

              material.map = texture;
              material.needsUpdate = true;
              material.transparent = false;
              material.opacity = 1.0;
              material.metalness = 1;
              material.roughness = 1;

              if (meshName.includes("light")) {
                material.emissive = new THREE.Color(0xfff8e1);
                material.emissiveIntensity = 0.8;
                material.emissiveMap = texture;
              }

              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          }
        }
      });

      console.log(`📊 Scene traversal complete: ${meshCount} meshes found`);

      isInitialized.current = true;
      console.log("✅ Initialization successful!");

      // Clear the safety timeout since we succeeded
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }

      // ✅ Call onLoaded after successful initialization
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
  }, [scene, texture, onLoaded, onError]);

  // Privacy mode effect
  useEffect(() => {
    if (!doorGlassMeshRef.current) return;

    console.log("🔒 Privacy mode changed:", privacyMode);
    if (doorGlassMeshRef.current.material) {
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
    if (screenMeshesRef.current.length === 0) return;

    console.log("📺 Meeting mode changed:", meetingOn);
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

  // ✅ Safety check before rendering
  if (!scene) {
    console.log("⚠️ Scene not ready, returning null");
    return null;
  }

  console.log("✅ Rendering scene");
  return <primitive object={scene} />;
}

useGLTF.preload("/models/office.glb");
useTexture.preload("/models/office-texture.jpeg");

export default OfficeModel;
