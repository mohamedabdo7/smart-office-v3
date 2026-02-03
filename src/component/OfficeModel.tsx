import { useEffect, useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

interface OfficeModelProps {
  privacyMode: boolean;
  meetingOn: boolean;
  curtainPosition: number;
  onLoaded: () => void;
}

function OfficeModel({
  privacyMode,
  meetingOn,
  curtainPosition,
  onLoaded,
}: OfficeModelProps) {
  const { scene } = useGLTF("/models/office.glb");
  const texture = useTexture("/models/office-texture.webp");

  const doorGlassMeshRef = useRef<THREE.Mesh | null>(null);
  const screenMeshesRef = useRef<THREE.Mesh[]>([]);
  const curtainMeshRef = useRef<THREE.Mesh | null>(null);
  const curtainInitialY = useRef<number | null>(null);
  const isInitialized = useRef(false);

  // INITIALIZATION
  useEffect(() => {
    if (isInitialized.current) return;

    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.needsUpdate = true;

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const meshName = mesh.name?.toLowerCase() || "";

        // Find DOOR glass
        if (meshName.includes("door") && meshName.includes("glass")) {
          doorGlassMeshRef.current = mesh;
        }

        // Find screen meshes
        if (meshName.includes("screen") || meshName.includes("tv")) {
          screenMeshesRef.current.push(mesh);
        }

        // Find CURTAIN mesh
        if (meshName.includes("curtain") && curtainInitialY.current === null) {
          curtainMeshRef.current = mesh;
          curtainInitialY.current = mesh.position.y;
        }

        if (mesh.material) {
          const meshName = mesh.name?.toLowerCase() || "";

          // ALL GLASS - Realistic solid color (NO TEXTURE)
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
          }
          // NON-GLASS
          else {
            const material = mesh.material as THREE.MeshStandardMaterial;

            material.map = texture;
            material.needsUpdate = true;
            material.transparent = false;
            material.opacity = 1.0;
            material.metalness = 1;
            material.roughness = 1;

            // Light meshes
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

    isInitialized.current = true;

    setTimeout(() => {
      onLoaded();
    }, 500);
  }, [scene, texture, onLoaded]);

  // DOOR GLASS PRIVACY MODE
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

  // MEETING SCREEN
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

  // CURTAIN ANIMATION
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

  return <primitive object={scene} />;
}

useGLTF.preload("/models/office.glb");
useTexture.preload("/models/office-texture.webp");

export default OfficeModel;
