import * as THREE from 'three';
import { type GraphicsPreset } from './Config.js';
import type { City } from '../world/City.js';
import type { Player } from '../player/Player.js';
import type { EnemyManager } from '../enemies/EnemyManager.js';

export interface MissionStatus {
  title: string;
  objective: string;
  progress: number;
  distance: number;
  completedFlash: boolean;
}

export class MissionManager {
  private marker: THREE.Group;
  private missionIndex = 0;
  private checkpointIndex = 0;
  private startDefeated = 0;
  private chaseTarget: THREE.Group;
  private chaseAngle = 0;
  private chaseHits = 0;
  private completionTimer = 0;
  private completedFlash = false;
  private compact: boolean;
  private tempTarget = new THREE.Vector3();
  private tempDirection = new THREE.Vector3();

  constructor(private scene: THREE.Scene, private city: City, preset: GraphicsPreset) {
    this.compact = preset === 'performance' || preset === 'low';
    this.marker = this.createMarker();
    this.scene.add(this.marker);
    this.chaseTarget = this.createChaseTarget();
    this.chaseTarget.visible = false;
    this.scene.add(this.chaseTarget);
    this.placeCheckpoint();
  }

  private createMarker(): THREE.Group {
    const root = new THREE.Group();
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x60e7ff, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.15, this.compact ? 5 : 8, this.compact ? 18 : 32), ringMaterial);
    ring.rotation.x = Math.PI / 2;
    root.add(ring);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 1.4, 14, this.compact ? 7 : 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x3bdcf7, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false })
    );
    beam.position.y = 7;
    root.add(beam);
    return root;
  }

  private createChaseTarget(): THREE.Group {
    const root = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 1.1, 2.1),
      new THREE.MeshStandardMaterial({ color: 0xbb3f2d, metalness: 0.65, roughness: 0.27, emissive: 0x3a0803, emissiveIntensity: 0.4 })
    );
    body.position.y = 0.8;
    body.castShadow = !this.compact;
    root.add(body);
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.75, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x8ab4c3, metalness: 0.5, roughness: 0.12 })
    );
    cabin.position.set(-0.4, 1.65, 0);
    root.add(cabin);
    if (!this.compact) {
      const wheelGeometry = new THREE.CylinderGeometry(0.38, 0.38, 0.2, 8);
      const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
      for (const x of [-1.5, 1.5]) for (const z of [-1.05, 1.05]) {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, 0.42, z);
        root.add(wheel);
      }
    }
    return root;
  }

  update(dt: number, elapsed: number, player: Player, enemies: EnemyManager): MissionStatus {
    this.completedFlash = false;
    if (this.completionTimer > 0) {
      this.completionTimer -= dt;
      if (this.completionTimer <= 0) this.advanceMission(enemies);
    }

    this.marker.rotation.y += dt * 0.9;
    this.marker.position.y += Math.sin(elapsed * 2.5) * 0.003;

    if (this.missionIndex === 0 && this.completionTimer <= 0) {
      if (player.root.position.distanceTo(this.marker.position) < 4.2) {
        this.checkpointIndex++;
        if (this.checkpointIndex >= 4) this.completeMission();
        else this.placeCheckpoint();
      }
    } else if (this.missionIndex === 1 && this.completionTimer <= 0) {
      if (enemies.defeatedCount - this.startDefeated >= 4) this.completeMission();
    } else if (this.missionIndex === 2 && this.completionTimer <= 0) {
      this.updateChaseTarget(dt);
      const distance = player.root.position.distanceTo(this.chaseTarget.position);
      if (distance < 5.5) {
        this.chaseHits++;
        this.chaseAngle += 0.7;
        player.velocity.y += 5;
        if (this.chaseHits >= 3) this.completeMission();
      }
    } else if (this.missionIndex === 3 && this.completionTimer <= 0) {
      if (enemies.defeatedCount - this.startDefeated >= 7) this.completeMission();
    }

    const target = this.missionIndex === 2 ? this.chaseTarget.position : this.marker.position;
    const distance = player.root.position.distanceTo(target);
    return this.getStatus(enemies, distance);
  }

  private updateChaseTarget(dt: number): void {
    this.chaseAngle += dt * 0.23;
    const next = this.city.getChaseRoutePoint(this.chaseAngle, this.tempTarget);
    const direction = this.tempDirection.copy(next).sub(this.chaseTarget.position);
    this.chaseTarget.position.lerp(next, 1 - Math.exp(-dt * 3.5));
    this.chaseTarget.position.y = next.y;
    this.chaseTarget.rotation.y = Math.atan2(-direction.x, -direction.z);
  }

  private getStatus(enemies: EnemyManager, distance: number): MissionStatus {
    if (this.completionTimer > 0) {
      return { title: 'MISSION COMPLETE', objective: 'Next activity incoming…', progress: 1, distance: 0, completedFlash: true };
    }
    if (this.missionIndex === 0) {
      return { title: 'Skyline Circuit', objective: `Reach checkpoint ${this.checkpointIndex + 1} of 4`, progress: this.checkpointIndex / 4, distance, completedFlash: this.completedFlash };
    }
    if (this.missionIndex === 1) {
      const defeated = Math.min(4, enemies.defeatedCount - this.startDefeated);
      return { title: 'Rooftop Disturbance', objective: `Defeat hostile operatives: ${defeated}/4`, progress: defeated / 4, distance: 0, completedFlash: this.completedFlash };
    }
    if (this.missionIndex === 2) {
      return { title: 'Courier Intercept', objective: `Catch the armored courier: ${this.chaseHits}/3`, progress: this.chaseHits / 3, distance, completedFlash: this.completedFlash };
    }
    const defeated = Math.min(7, enemies.defeatedCount - this.startDefeated);
    return { title: 'Street Crime', objective: `Secure the marked district: ${defeated}/7`, progress: defeated / 7, distance, completedFlash: this.completedFlash };
  }

  private completeMission(): void {
    if (this.completionTimer > 0) return;
    this.completionTimer = 3.2;
    this.completedFlash = true;
    this.marker.visible = false;
    this.chaseTarget.visible = false;
    localStorage.setItem('arachnid-mission', String((this.missionIndex + 1) % 4));
  }

  private advanceMission(enemies: EnemyManager): void {
    this.missionIndex = (this.missionIndex + 1) % 4;
    this.checkpointIndex = 0;
    this.startDefeated = enemies.defeatedCount;
    this.chaseHits = 0;
    this.chaseAngle = Math.random() * Math.PI * 2;
    this.marker.visible = this.missionIndex !== 1 && this.missionIndex !== 2;
    this.chaseTarget.visible = this.missionIndex === 2;
    if (this.missionIndex === 0 || this.missionIndex === 3) this.placeCheckpoint();
  }

  private placeCheckpoint(): void {
    const p = this.city.getRandomRooftop(this.checkpointIndex * 5 + this.missionIndex * 11 + 2);
    this.marker.position.copy(p);
    this.marker.position.y += 3;
    this.marker.visible = true;
  }
}
