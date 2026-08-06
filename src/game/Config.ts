export type GraphicsPreset = 'performance' | 'low' | 'medium' | 'high';

export interface PerformanceProfile {
  renderScale: number;
  minRenderScale: number;
  maxRenderScale: number;
  targetFps: number;
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  maxBuildings: number;
  roofDetails: number;
  streetLights: number;
  traffic: number;
  pedestrians: number;
  enemies: number;
  farPlane: number;
  fogDensity: number;
  uiHz: number;
  aiHz: number;
  trafficHz: number;
  pedestrianHz: number;
}

export const PERFORMANCE_PROFILES: Record<GraphicsPreset, PerformanceProfile> = {
  performance: {
    renderScale: 0.68,
    minRenderScale: 0.5,
    maxRenderScale: 0.76,
    targetFps: 40,
    shadows: false,
    shadowMapSize: 0,
    antialias: false,
    maxBuildings: 330,
    roofDetails: 20,
    streetLights: 26,
    traffic: 10,
    pedestrians: 8,
    enemies: 6,
    farPlane: 1080,
    fogDensity: 0.00152,
    uiHz: 8,
    aiHz: 10,
    trafficHz: 20,
    pedestrianHz: 12,
  },
  low: {
    renderScale: 0.9,
    minRenderScale: 0.68,
    maxRenderScale: 1,
    targetFps: 50,
    shadows: false,
    shadowMapSize: 0,
    antialias: false,
    maxBuildings: 440,
    roofDetails: 38,
    streetLights: 52,
    traffic: 16,
    pedestrians: 14,
    enemies: 9,
    farPlane: 1350,
    fogDensity: 0.00122,
    uiHz: 10,
    aiHz: 15,
    trafficHz: 30,
    pedestrianHz: 20,
  },
  medium: {
    renderScale: 1.08,
    minRenderScale: 0.82,
    maxRenderScale: 1.2,
    targetFps: 60,
    shadows: true,
    shadowMapSize: 512,
    antialias: true,
    maxBuildings: 520,
    roofDetails: 52,
    streetLights: 76,
    traffic: 20,
    pedestrians: 18,
    enemies: 12,
    farPlane: 1550,
    fogDensity: 0.00108,
    uiHz: 12,
    aiHz: 20,
    trafficHz: 45,
    pedestrianHz: 30,
  },
  high: {
    renderScale: 1.35,
    minRenderScale: 1,
    maxRenderScale: 1.5,
    targetFps: 60,
    shadows: true,
    shadowMapSize: 1024,
    antialias: true,
    maxBuildings: 620,
    roofDetails: 70,
    streetLights: 110,
    traffic: 30,
    pedestrians: 28,
    enemies: 14,
    farPlane: 1800,
    fogDensity: 0.00096,
    uiHz: 15,
    aiHz: 24,
    trafficHz: 60,
    pedestrianHz: 45,
  },
};

export function detectRecommendedPreset(): GraphicsPreset {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const platform = `${navigator.platform} ${navigator.userAgent}`;
  const isIntelMac = /MacIntel|Intel Mac OS X/i.test(platform) && !/Apple Silicon|arm64/i.test(platform);
  const constrainedMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 8;
  const constrainedCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
  return isIntelMac || constrainedMemory || constrainedCpu ? 'performance' : 'medium';
}

export const CONFIG = {
  world: {
    blockSize: 74,
    roadWidth: 17,
    gridRadius: 8,
    streetY: 0,
  },
  player: {
    radius: 0.65,
    height: 2.15,
    walkSpeed: 11,
    sprintSpeed: 19,
    airControl: 12,
    jumpSpeed: 13.5,
    gravity: 31,
    maxFallSpeed: 58,
    groundAccel: 55,
    groundDrag: 12,
    swingPump: 31,
    swingMaxSpeed: 68,
    webMinLength: 8,
    webMaxLength: 76,
    webZipSpeed: 46,
    climbSpeed: 8.5,
    climbSprintSpeed: 14.5,
    wallJumpSpeed: 12.5,
    wallJumpLift: 10,
  },
  camera: {
    distance: 8.5,
    height: 3.3,
    sensitivity: 0.0027,
    minPitch: -0.72,
    maxPitch: 0.92,
  },
} as const;
