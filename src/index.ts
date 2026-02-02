export interface CameraPosition {
  x: string;
  y: string;
  z: string;
}

export interface CameraInfo {
  position: CameraPosition;
  target: CameraPosition;
  distance?: string;
}

export interface ModelInfo {
  center: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  maxDimension: number;
}
