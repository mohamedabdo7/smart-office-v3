import { useEffect, useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// ⚠️ اعمله false لما تخلص من الـ debug
const DEBUG_HIT_ZONES = true;

interface OfficeModelProps {
  privacyMode: boolean;
  meetingOn: boolean;
  curtainPosition: number;
  onLoaded: () => void;
  onError?: () => void;
  onLightClick?: () => void;
  onPrivacyClick?: () => void;
  onMeetingClick?: () => void;
  onCurtainClick?: () => void;
  onHoverEnter?: (deviceType: string, meshName: string) => void;
  onHoverLeave?: () => void;
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isSafari = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// ✅ الترتيب مهم جداً — الأكثر تحديداً الأول
const getDeviceType = (meshName: string): string | null => {
  const name = meshName.toLowerCase();

  // hit zones الأول دايماً
  if (name === "__hit_light__") return "light";
  if (name === "__hit_curtain__") return "curtain";

  // Curtains
  if (name.includes("curtain")) return "curtain";

  // Screens — لازم يجي قبل "glass" عشان TV_Glass و Project_Glass
  if (name.includes("tv")) return "screen";
  if (name.includes("project")) return "screen";
  if (name.includes("screen")) return "screen";

  // Glass (privacy) — بعد الـ screens
  if (name.includes("door_glass")) return "glass";
  if (name.includes("glass_for_facade")) return "glass";
  if (name.includes("glass")) return "glass";

  return null;
};

export const DEVICE_LABELS: Record<string, string> = {
  light: "💡 النور — اضغط للتشغيل/الإطفاء",
  glass: "🔒 الزجاج — اضغط للـ Privacy",
  screen: "📺 الشاشة — اضغط لبدء/إنهاء الاجتماع",
  curtain: "🪟 الستارة — اضغط للتحريك",
};

// ✅ Hardcoded من الـ mesh data اللي وصلتنا
// Flooring: worldPos(4.094, 0, -15.297) | size(10.131, 3.547, 13.309)
// Curtains: worldPos(4.094, 0, -15.297) | size(0.606, 3.268, 6.069)
const LIGHT_HIT = {
  x: 4.094,
  y: 3.2, // قريب من السقف (Flooring height ≈ 3.547)
  z: -15.297,
  w: 10.0, // يغطي عرض الأوضة كلها
  h: 10.0,
};

const CURTAIN_HIT = {
  x: 4.094, // نفس x الـ Curtains mesh
  y: 1.634, // منتصف الارتفاع (3.268 / 2)
  z: -15.297, // نفس z الـ Curtains mesh
  w: 1.5, // أكبر شوية من حجم الستارة (0.606)
  h: 3.5, // أكبر شوية من ارتفاع الستارة (3.268)
};

function OfficeModel({
  privacyMode,
  meetingOn,
  curtainPosition,
  onLoaded,
  onError,
  onLightClick,
  onPrivacyClick,
  onMeetingClick,
  onCurtainClick,
  onHoverEnter,
  onHoverLeave,
}: OfficeModelProps) {
  const { scene: threeScene } = useThree();

  const doorGlassMeshRef = useRef<THREE.Mesh | null>(null);
  const screenMeshesRef = useRef<THREE.Mesh[]>([]);
  const curtainMeshRef = useRef<THREE.Mesh | null>(null);
  const curtainInitialY = useRef<number | null>(null);
  const curtainHitMeshRef = useRef<THREE.Mesh | null>(null);
  const lightHitMeshRef = useRef<THREE.Mesh | null>(null);
  const isInitialized = useRef(false);
  const hasErrorOccurred = useRef(false);
  const loadStartTime = useRef<number>(Date.now());
  const loadTimeoutRef = useRef<number | null>(null);

  const { scene } = useGLTF("/models/office.glb", true, true, (loader) => {
    loader.manager.onError = (url) => {
      console.error("❌ GLTF error:", url);
      if (onError && !hasErrorOccurred.current) {
        hasErrorOccurred.current = true;
        onError();
      }
    };
  });

  const texture = useTexture("/models/office-texture.jpeg");

  useEffect(() => {
    loadTimeoutRef.current = window.setTimeout(() => {
      if (!isInitialized.current) {
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
    if (isInitialized.current || !scene || !texture) return;

    try {
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = isIOS() || isSafari() ? 4 : 16;
      texture.needsUpdate = true;

      // ── Traverse & classify ─────────────────────────────
      scene.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const mesh = child as THREE.Mesh;
        const meshName = mesh.name?.toLowerCase() || "";

        // ✅ Door_Glass → privacy
        if (meshName === "door_glass") {
          doorGlassMeshRef.current = mesh;
          console.log("✅ door glass:", mesh.name);
        }

        // ✅ TV_Glass + Project_Glass → screens
        if (meshName === "tv_glass" || meshName === "project_glass") {
          screenMeshesRef.current.push(mesh);
          console.log("✅ screen:", mesh.name);
        }

        // ✅ Curtains
        if (meshName === "curtains" && curtainInitialY.current === null) {
          curtainMeshRef.current = mesh;
          curtainInitialY.current = mesh.position.y;
          console.log("✅ curtain:", mesh.name, "y=", mesh.position.y);
        }

        // Apply materials
        if (!mesh.material) return;

        if (meshName.includes("glass")) {
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
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.map = texture;
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.metalness = 1;
          mat.roughness = 1;
          mat.needsUpdate = true;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });

      // ── 🟡 Hit zone للنور (hardcoded من mesh data) ──────
      {
        const hitGeo = new THREE.PlaneGeometry(LIGHT_HIT.w, LIGHT_HIT.h);
        const hitMat = new THREE.MeshBasicMaterial({
          color: DEBUG_HIT_ZONES ? 0xffff00 : 0xffffff,
          transparent: true,
          opacity: DEBUG_HIT_ZONES ? 0.35 : 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.name = "__hit_light__";
        hitMesh.position.set(LIGHT_HIT.x, LIGHT_HIT.y, LIGHT_HIT.z);
        hitMesh.rotation.x = -Math.PI / 2; // horizontal عشان السقف
        hitMesh.renderOrder = 2;
        threeScene.add(hitMesh);
        lightHitMeshRef.current = hitMesh;
        console.log("✅ light hit zone at:", hitMesh.position);
      }

      // ── 🟣 Hit zone للستارة (hardcoded من mesh data) ────
      {
        const hitGeo = new THREE.PlaneGeometry(CURTAIN_HIT.w, CURTAIN_HIT.h);
        const hitMat = new THREE.MeshBasicMaterial({
          color: DEBUG_HIT_ZONES ? 0xff00ff : 0xffffff,
          transparent: true,
          opacity: DEBUG_HIT_ZONES ? 0.45 : 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.name = "__hit_curtain__";
        hitMesh.position.set(CURTAIN_HIT.x, CURTAIN_HIT.y, CURTAIN_HIT.z);
        hitMesh.renderOrder = 2;
        threeScene.add(hitMesh);
        curtainHitMeshRef.current = hitMesh;
        console.log("✅ curtain hit zone at:", hitMesh.position);
      }

      isInitialized.current = true;
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      console.log(`✅ Load time: ${Date.now() - loadStartTime.current}ms`);
      setTimeout(() => onLoaded(), 500);
    } catch (err) {
      console.error("❌ Init error:", err);
      if (onError && !hasErrorOccurred.current) {
        hasErrorOccurred.current = true;
        onError();
      }
    }
  }, [scene, texture, onLoaded, onError, threeScene]);

  useEffect(() => {
    return () => {
      if (curtainHitMeshRef.current)
        threeScene.remove(curtainHitMeshRef.current);
      if (lightHitMeshRef.current) threeScene.remove(lightHitMeshRef.current);
    };
  }, [threeScene]);

  // Privacy mode
  useEffect(() => {
    if (!doorGlassMeshRef.current?.material) return;
    const mat = doorGlassMeshRef.current.material as THREE.MeshBasicMaterial;
    mat.color = new THREE.Color(privacyMode ? 0xfcfcfc : 0xc8dce8);
    mat.opacity = privacyMode ? 0.95 : 0.3;
    mat.needsUpdate = true;
  }, [privacyMode]);

  // Meeting screen
  useEffect(() => {
    screenMeshesRef.current.forEach((mesh) => {
      if (!mesh.material) return;
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.color = new THREE.Color(meetingOn ? 0x00ff88 : 0x333333);
        mesh.material.opacity = meetingOn ? 0.8 : 0.3;
        mesh.material.needsUpdate = true;
      } else {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissive = new THREE.Color(meetingOn ? 0x00ff88 : 0x000000);
        mat.emissiveIntensity = meetingOn ? 2.0 : 0;
        mat.needsUpdate = true;
      }
    });
  }, [meetingOn]);

  // Curtain animation
  useEffect(() => {
    if (!curtainMeshRef.current || curtainInitialY.current === null) return;
    const targetY = curtainInitialY.current + (curtainPosition / 100) * 3.0;
    let frameId: number;
    const animate = () => {
      if (!curtainMeshRef.current || curtainInitialY.current === null) return;
      const diff = targetY - curtainMeshRef.current.position.y;
      if (Math.abs(diff) < 0.001) {
        curtainMeshRef.current.position.y = targetY;
        return;
      }
      curtainMeshRef.current.position.y = THREE.MathUtils.lerp(
        curtainMeshRef.current.position.y,
        targetY,
        0.1,
      );
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [curtainPosition]);

  // Click handler
  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    const rawName = (event.object as THREE.Mesh).name || "";
    const deviceType = getDeviceType(rawName);

    console.group("🖱️ CLICK");
    console.log(`  mesh: "${rawName}" → type: "${deviceType ?? "❌ none"}"`);
    console.groupEnd();

    if (deviceType === "light") {
      onLightClick?.();
      return;
    }
    if (deviceType === "glass") {
      onPrivacyClick?.();
      return;
    }
    if (deviceType === "screen") {
      onMeetingClick?.();
      return;
    }
    if (deviceType === "curtain") {
      onCurtainClick?.();
      return;
    }
  };

  // Hover enter
  const handlePointerEnter = (event: any) => {
    event.stopPropagation();
    const rawName = (event.object as THREE.Mesh).name || "";
    const deviceType = getDeviceType(rawName);
    if (deviceType) {
      onHoverEnter?.(deviceType, rawName);
      document.body.style.cursor = "pointer";
    }
  };

  // Hover leave
  const handlePointerLeave = (event: any) => {
    event.stopPropagation();
    onHoverLeave?.();
    document.body.style.cursor = "grab";
  };

  if (!scene) return null;

  return (
    <primitive
      object={scene}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    />
  );
}

useGLTF.preload("/models/office.glb");
useTexture.preload("/models/office-texture.jpeg");

export default OfficeModel;
