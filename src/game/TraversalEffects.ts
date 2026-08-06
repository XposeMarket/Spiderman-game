import * as THREE from 'three';
import type { Player } from '../player/Player.js';
import type { GraphicsPreset } from './Config.js';

interface StreakSeed {
  x: number;
  y: number;
  depth: number;
  length: number;
  phase: number;
}

/**
 * Screen-aligned traversal streaks.
 *
 * The streak field is still rendered as one LineSegments draw call, but its
 * vanishing point is calculated from the hero's projected chest position.
 * This makes the effect stay visually centered on the player even when the
 * camera uses look-ahead framing or the animated body turns during a swing.
 */
export class TraversalEffects {
  private readonly streaks: THREE.LineSegments;
  private readonly streakPositions: THREE.BufferAttribute;
  private readonly material: THREE.LineBasicMaterial;
  private readonly seeds: StreakSeed[] = [];
  private readonly pulse: THREE.Mesh;
  private readonly projectedHero = new THREE.Vector3();
  private readonly streakCenter = new THREE.Vector2();
  private streakCenterReady = false;
  private pulseLife = 0;
  private readonly pulseMaxLife = 0.48;

  constructor(scene: THREE.Scene, preset: GraphicsPreset) {
    const performanceMode = preset === 'performance';
    const compact = performanceMode || preset === 'low';
    const count = performanceMode ? 20 : compact ? 28 : 52;
    const array = new Float32Array(count * 2 * 3);
    const geometry = new THREE.BufferGeometry();
    this.streakPositions = new THREE.BufferAttribute(array, 3);
    geometry.setAttribute('position', this.streakPositions);

    this.material = new THREE.LineBasicMaterial({
      color: 0xbcefff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    this.streaks = new THREE.LineSegments(geometry, this.material);
    this.streaks.frustumCulled = false;
    this.streaks.visible = false;
    this.streaks.renderOrder = 30;
    scene.add(this.streaks);

    for (let i = 0; i < count; i++) {
      const random = (n: number) => {
        const value = Math.sin((i + 1) * (n * 91.71 + 17.31)) * 43758.5453;
        return value - Math.floor(value);
      };
      let x = random(1) * 2 - 1;
      let y = random(2) * 2 - 1;
      const radius = Math.hypot(x, y);
      if (radius < 0.24) {
        const angle = random(6) * Math.PI * 2;
        x = Math.cos(angle) * 0.24;
        y = Math.sin(angle) * 0.24;
      }
      this.seeds.push({
        x,
        y,
        depth: random(3),
        length: 0.45 + random(4) * 1.3,
        phase: random(5),
      });
    }

    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0xff315f,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.pulse = new THREE.Mesh(new THREE.RingGeometry(0.68, 0.88, performanceMode ? 16 : compact ? 20 : 32), pulseMaterial);
    this.pulse.visible = false;
    this.pulse.renderOrder = 31;
    scene.add(this.pulse);
  }

  triggerBurst(): void {
    this.pulseLife = this.pulseMaxLife;
    this.pulse.visible = true;
  }

  update(dt: number, elapsed: number, player: Player, camera: THREE.PerspectiveCamera): number {
    const totalSpeed = player.velocity.length();
    const speedFx = THREE.MathUtils.clamp((totalSpeed - 17) / 43, 0, 1);
    const highAltitude = THREE.MathUtils.clamp((player.root.position.y - 35) / 115, 0, 1);
    const amount = Math.max(speedFx, highAltitude * speedFx * 0.78);

    if (amount > 0.035) {
      // Project the hero's chest into normalized device coordinates. This is
      // the true on-screen location the player sees, independent of body yaw.
      camera.updateMatrixWorld();
      this.projectedHero.copy(player.root.position);
      this.projectedHero.y += 1.15;
      this.projectedHero.project(camera);
      const targetX = THREE.MathUtils.clamp(this.projectedHero.x, -0.72, 0.72);
      const targetY = THREE.MathUtils.clamp(this.projectedHero.y, -0.62, 0.62);
      if (!this.streakCenterReady || !this.streaks.visible) {
        this.streakCenter.set(targetX, targetY);
        this.streakCenterReady = true;
      } else {
        const centerBlend = 1 - Math.exp(-dt * 11);
        this.streakCenter.x = THREE.MathUtils.lerp(this.streakCenter.x, targetX, centerBlend);
        this.streakCenter.y = THREE.MathUtils.lerp(this.streakCenter.y, targetY, centerBlend);
      }

      // Vertices are written in camera-local space. NDC positions are converted
      // to perspective-correct local coordinates at each vertex depth, keeping
      // the apparent vanishing point locked to the projected hero.
      this.streaks.position.copy(camera.position);
      this.streaks.quaternion.copy(camera.quaternion);
      const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      const aspect = camera.aspect;
      const positions = this.streakPositions.array as Float32Array;
      for (let i = 0; i < this.seeds.length; i++) {
        const seed = this.seeds[i];
        const travel = (seed.depth + elapsed * (0.18 + amount * 0.72) + seed.phase) % 1;
        const startDepth = 7 + travel * 31;
        const length = (2.3 + amount * 10.5) * seed.length;
        const endDepth = Math.max(0.9, startDepth - length);

        const startRadiusX = 0.11 + travel * 0.86;
        const startRadiusY = 0.08 + travel * 0.64;
        const stretch = 0.075 + amount * 0.16;
        const startNdcX = this.streakCenter.x + seed.x * startRadiusX;
        const startNdcY = this.streakCenter.y + seed.y * startRadiusY;
        const endNdcX = this.streakCenter.x + seed.x * (startRadiusX + stretch);
        const endNdcY = this.streakCenter.y + seed.y * (startRadiusY + stretch * 0.78);

        const startHalfHeight = tanHalfFov * startDepth;
        const endHalfHeight = tanHalfFov * endDepth;
        const index = i * 6;
        positions[index] = startNdcX * startHalfHeight * aspect;
        positions[index + 1] = startNdcY * startHalfHeight;
        positions[index + 2] = -startDepth;
        positions[index + 3] = endNdcX * endHalfHeight * aspect;
        positions[index + 4] = endNdcY * endHalfHeight;
        positions[index + 5] = -endDepth;
      }
      this.streakPositions.needsUpdate = true;
      this.material.opacity = amount * 0.48;
      this.streaks.visible = true;
    } else {
      this.streaks.visible = false;
      this.material.opacity = 0;
      this.streakCenterReady = false;
    }

    if (this.pulseLife > 0) {
      this.pulseLife = Math.max(0, this.pulseLife - dt);
      const progress = 1 - this.pulseLife / this.pulseMaxLife;
      this.pulse.position.copy(player.root.position);
      this.pulse.position.y += 1.25;
      this.pulse.quaternion.copy(camera.quaternion);
      this.pulse.scale.setScalar(1 + progress * 6.5);
      (this.pulse.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.68;
      if (this.pulseLife === 0) this.pulse.visible = false;
    }

    return amount;
  }
}
