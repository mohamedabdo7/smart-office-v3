import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DeviceType } from "./DevicePopup";

export interface MeshGroups {
  curtain: THREE.Mesh | null;
  screens: THREE.Mesh[];
  doorGlass: THREE.Mesh | null;
}

interface ClickHandlerProps {
  meshGroups: MeshGroups | null;
  onDeviceClick: (
    device: DeviceType,
    screenPos: { x: number; y: number },
  ) => void;
}

function ClickHandler({ meshGroups, onDeviceClick }: ClickHandlerProps) {
  const { camera, gl, raycaster } = useThree();

  useEffect(() => {
    if (!meshGroups) return;

    const handleClick = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      // Build a flat list of { mesh, device } pairs
      const targets: { mesh: THREE.Mesh; device: DeviceType }[] = [];

      meshGroups.screens.forEach((m) =>
        targets.push({ mesh: m, device: "meeting" }),
      );
      if (meshGroups.curtain)
        targets.push({ mesh: meshGroups.curtain, device: "curtain" });
      if (meshGroups.doorGlass)
        targets.push({ mesh: meshGroups.doorGlass, device: "privacy" });

      const meshes = targets.map((t) => t.mesh);
      if (meshes.length === 0) return;

      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const target = targets.find((t) => t.mesh === hitMesh);
        if (target) {
          onDeviceClick(target.device, { x: e.clientX, y: e.clientY });
        }
      }
    };

    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [meshGroups, camera, gl, raycaster, onDeviceClick]);

  return null;
}

export default ClickHandler;

// import { useEffect } from "react";
// import { useThree } from "@react-three/fiber";
// import * as THREE from "three";
// import { DeviceType } from "./DevicePopup";

// export interface MeshGroups {
//   lights: THREE.Mesh[];
//   curtain: THREE.Mesh | null;
//   screens: THREE.Mesh[];
//   doorGlass: THREE.Mesh | null;
// }

// interface ClickHandlerProps {
//   meshGroups: MeshGroups | null;
//   onDeviceClick: (
//     device: DeviceType,
//     screenPos: { x: number; y: number },
//   ) => void;
// }

// function ClickHandler({ meshGroups, onDeviceClick }: ClickHandlerProps) {
//   const { camera, gl, raycaster } = useThree();

//   useEffect(() => {
//     if (!meshGroups) return;

//     const handleClick = (e: MouseEvent) => {
//       const rect = gl.domElement.getBoundingClientRect();
//       const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
//       const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

//       raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

//       // Build a flat list of { mesh, device } pairs
//       const targets: { mesh: THREE.Mesh; device: DeviceType }[] = [];

//       meshGroups.lights.forEach((m) =>
//         targets.push({ mesh: m, device: "lights" }),
//       );
//       meshGroups.screens.forEach((m) =>
//         targets.push({ mesh: m, device: "meeting" }),
//       );
//       if (meshGroups.curtain)
//         targets.push({ mesh: meshGroups.curtain, device: "curtain" });
//       if (meshGroups.doorGlass)
//         targets.push({ mesh: meshGroups.doorGlass, device: "privacy" });

//       const meshes = targets.map((t) => t.mesh);
//       if (meshes.length === 0) return;

//       const intersects = raycaster.intersectObjects(meshes, false);

//       if (intersects.length > 0) {
//         const hitMesh = intersects[0].object as THREE.Mesh;
//         const target = targets.find((t) => t.mesh === hitMesh);
//         if (target) {
//           onDeviceClick(target.device, { x: e.clientX, y: e.clientY });
//         }
//       }
//     };

//     gl.domElement.addEventListener("click", handleClick);
//     return () => gl.domElement.removeEventListener("click", handleClick);
//   }, [meshGroups, camera, gl, raycaster, onDeviceClick]);

//   return null;
// }

// export default ClickHandler;
