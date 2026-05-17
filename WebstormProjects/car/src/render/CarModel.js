/**
 * @file 3D 赛车模型
 *
 * 使用 Three.js 基本几何体（Box、Cylinder）组合成写实风格的赛车外观。
 * 车身尺寸与物理引擎匹配（半宽 0.9m、半长 2.0m），确保碰撞箱与视觉一致。
 *
 * 模型朝向：默认朝向 +X 轴方向，旋转角度直接使用物理引擎的 angle 值。
 * 更新位置时使用 2D→3D 映射：physics {x, y} → THREE {x, 0, z}（z = y）。
 *
 * @module render/CarModel
 */

import * as THREE from 'three';

// ============================================================
// 外观颜色常量
// ============================================================

/** 车身主色（法拉利红） */
const BODY_COLOR = 0xcc0000;

/** 驾驶舱玻璃色（深灰透明） */
const CABIN_COLOR = 0x222222;

/** 车轮颜色（深黑灰） */
const WHEEL_COLOR = 0x1a1a1a;

/** 轮毂颜色（银灰） */
const HUB_COLOR = 0x888888;

/** 前大灯颜色（冷白） */
const HEADLIGHT_COLOR = 0xffffcc;

/** 尾灯颜色（红色） */
const TAILLIGHT_COLOR = 0xff2200;

/** 尾翼颜色（碳纤维黑） */
const SPOILER_COLOR = 0x111111;

// ============================================================
// 尺寸常量（米）
// ============================================================

/** 车身半长（匹配物理引擎 CAR_HALF_LENGTH = 2.0） */
const BODY_HALF_LENGTH = 2.0;

/** 车身半宽（匹配物理引擎 CAR_HALF_WIDTH = 0.9） */
const BODY_HALF_WIDTH = 0.9;

/** 车身高度 */
const BODY_HEIGHT = 0.35;

/** 驾驶舱高度 */
const CABIN_HEIGHT = 0.25;

/** 驾驶舱长度 */
const CABIN_LENGTH = 2.2;

/** 驾驶舱宽度（比车身略窄） */
const CABIN_WIDTH = 1.5;

/** 车轮半径 */
const WHEEL_RADIUS = 0.28;

/** 车轮厚度 */
const WHEEL_THICKNESS = 0.18;

/** 前轮中心到车身中心的 X 距离 */
const WHEEL_FRONT_X = 1.4;

/** 后轮中心到车身中心的 X 距离 */
const WHEEL_REAR_X = -1.5;

/** 轮距（前后轮 Y 方向偏移） */
const WHEEL_TRACK = BODY_HALF_WIDTH + 0.05;

export class CarModel {
  /**
   * @param {Object} [config] - 外观配置
   * @param {number} [config.bodyColor=0xcc0000] - 车身颜色
   * @param {number} [config.cabinColor=0x222222] - 驾驶舱颜色
   * @param {number} [config.wheelColor=0x1a1a1a] - 车轮颜色
   * @param {boolean} [config.castShadow=true] - 是否投射阴影
   */
  constructor(config = {}) {
    /** @type {THREE.Group} 赛车模型根对象 */
    this.group = new THREE.Group();
    this.group.name = 'car';

    /** @type {Object} 外观配置 */
    this._config = {
      bodyColor: config.bodyColor ?? BODY_COLOR,
      cabinColor: config.cabinColor ?? CABIN_COLOR,
      wheelColor: config.wheelColor ?? WHEEL_COLOR,
      castShadow: config.castShadow !== false,
    };

    /** @type {THREE.Mesh[]} 车轮网格引用（用于动画） */
    this.wheels = [];

    // 构建模型
    this._build();
  }

  /**
   * 构建完整的赛车模型
   * @private
   */
  _build() {
    this._createBody();
    this._createCabin();
    this._createWheels();
    this._createLights();
    this._createSpoiler();
    this._createUnderGlow();
  }

  /**
   * 创建车身（中心扁平长方体，前端略低）
   * @private
   */
  _createBody() {
    const bodyMat = new THREE.MeshPhongMaterial({
      color: this._config.bodyColor,
      roughness: 0.4,
      metalness: 0.7,
      envMapIntensity: 0.5,
    });

    // 主车身
    const bodyGeo = new THREE.BoxGeometry(
      BODY_HALF_LENGTH * 2,
      BODY_HEIGHT,
      BODY_HALF_WIDTH * 2
    );
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = BODY_HEIGHT / 2 + 0.05;
    body.castShadow = this._config.castShadow;
    body.receiveShadow = true;
    body.name = 'carBody';
    this.group.add(body);

    // 前鼻翼（略低）
    const noseGeo = new THREE.BoxGeometry(0.6, 0.15, 1.2);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.position.set(BODY_HALF_LENGTH + 0.3, 0.1, 0);
    nose.name = 'carNose';
    this.group.add(nose);

    // 后扩散器（略高）
    const diffGeo = new THREE.BoxGeometry(0.4, 0.12, 1.4);
    const diff = new THREE.Mesh(diffGeo, bodyMat);
    diff.position.set(-(BODY_HALF_LENGTH + 0.2), 0.08, 0);
    diff.name = 'carDiffuser';
    this.group.add(diff);
  }

  /**
   * 创建驾驶舱（玻璃罩）
   * @private
   */
  _createCabin() {
    const cabinMat = new THREE.MeshPhongMaterial({
      color: this._config.cabinColor,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.6,
      envMapIntensity: 1.0,
    });

    // 主驾驶舱
    const cabinGeo = new THREE.BoxGeometry(CABIN_LENGTH, CABIN_HEIGHT, CABIN_WIDTH);
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(-0.3, BODY_HEIGHT + CABIN_HEIGHT / 2 + 0.05, 0);
    cabin.castShadow = this._config.castShadow;
    cabin.name = 'carCabin';
    this.group.add(cabin);

    // 前挡风（略微前倾效果）
    const windshieldMat = new THREE.MeshPhongMaterial({
      color: 0x88bbff,
      roughness: 0.05,
      metalness: 0.3,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const shieldGeo = new THREE.PlaneGeometry(CABIN_WIDTH * 0.85, 0.2);
    const shield = new THREE.Mesh(shieldGeo, windshieldMat);
    shield.position.set(0.8, BODY_HEIGHT + CABIN_HEIGHT + 0.05, 0);
    shield.rotation.x = -0.2;
    shield.name = 'windshield';
    this.group.add(shield);
  }

  /**
   * 创建四个车轮（含轮毂）
   * @private
   */
  _createWheels() {
    const wheelMat = new THREE.MeshPhongMaterial({
      color: this._config.wheelColor,
      roughness: 0.9,
      metalness: 0.1,
    });

    const hubMat = new THREE.MeshPhongMaterial({
      color: HUB_COLOR,
      roughness: 0.3,
      metalness: 0.8,
    });

    // 车轮位置：前左、前右、后左、后右
    const wheelPositions = [
      { x: WHEEL_FRONT_X, z: WHEEL_TRACK, label: 'FL' },
      { x: WHEEL_FRONT_X, z: -WHEEL_TRACK, label: 'FR' },
      { x: WHEEL_REAR_X, z: WHEEL_TRACK, label: 'RL' },
      { x: WHEEL_REAR_X, z: -WHEEL_TRACK, label: 'RR' },
    ];

    for (const pos of wheelPositions) {
      const wheelGroup = new THREE.Group();
      wheelGroup.name = `wheel_${pos.label}`;

      // 轮胎（圆柱体，绕 Z 轴旋转使其朝前）
      const tireGeo = new THREE.CylinderGeometry(
        WHEEL_RADIUS,
        WHEEL_RADIUS,
        WHEEL_THICKNESS,
        16
      );
      const tire = new THREE.Mesh(tireGeo, wheelMat);
      tire.rotation.x = Math.PI / 2; // 平躺：圆柱沿 Z 方向
      tire.castShadow = this._config.castShadow;
      tire.name = 'tire';

      // 轮毂（略小的圆柱）
      const hubGeo = new THREE.CylinderGeometry(
        WHEEL_RADIUS * 0.5,
        WHEEL_RADIUS * 0.5,
        WHEEL_THICKNESS * 1.01,
        8
      );
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.rotation.x = Math.PI / 2;
      hub.name = 'hub';

      wheelGroup.add(tire);
      wheelGroup.add(hub);

      wheelGroup.position.set(pos.x, WHEEL_RADIUS, pos.z);
      this.group.add(wheelGroup);
      this.wheels.push(wheelGroup);
    }
  }

  /**
   * 创建前后车灯
   * @private
   */
  _createLights() {
    // 前大灯（左右各一）
    const lightMat = new THREE.MeshPhongMaterial({
      color: HEADLIGHT_COLOR,
      emissive: HEADLIGHT_COLOR,
      emissiveIntensity: 0.3,
      roughness: 0.1,
      metalness: 0.5,
    });

    const lightGeo = new THREE.BoxGeometry(0.08, 0.12, 0.25);
    for (const side of [-1, 1]) {
      const headlight = new THREE.Mesh(lightGeo, lightMat);
      headlight.position.set(
        BODY_HALF_LENGTH + 0.01,
        0.25,
        side * 0.6
      );
      headlight.name = `headlight_${side > 0 ? 'R' : 'L'}`;
      this.group.add(headlight);
    }

    // 尾灯（红色发光）
    const tailMat = new THREE.MeshPhongMaterial({
      color: TAILLIGHT_COLOR,
      emissive: TAILLIGHT_COLOR,
      emissiveIntensity: 0.2,
      roughness: 0.4,
      metalness: 0.3,
    });

    const tailGeo = new THREE.BoxGeometry(0.08, 0.15, 0.3);
    for (const side of [-1, 1]) {
      const taillight = new THREE.Mesh(tailGeo, tailMat);
      taillight.position.set(
        -(BODY_HALF_LENGTH + 0.01),
        0.25,
        side * 0.65
      );
      taillight.name = `taillight_${side > 0 ? 'R' : 'L'}`;
      this.group.add(taillight);
    }
  }

  /**
   * 创建后尾翼
   * @private
   */
  _createSpoiler() {
    const spoilerMat = new THREE.MeshPhongMaterial({
      color: SPOILER_COLOR,
      roughness: 0.8,
      metalness: 0.2,
    });

    // 尾翼横板
    const wingGeo = new THREE.BoxGeometry(1.6, 0.04, 0.3);
    const wing = new THREE.Mesh(wingGeo, spoilerMat);
    wing.position.set(-1.8, 0.7, 0);
    wing.name = 'spoilerWing';
    this.group.add(wing);

    // 尾翼支架（左右各一）
    const standGeo = new THREE.BoxGeometry(0.04, 0.35, 0.04);
    for (const side of [-1, 1]) {
      const stand = new THREE.Mesh(standGeo, spoilerMat);
      stand.position.set(-1.8, 0.5, side * 0.6);
      stand.name = `spoilerStand_${side > 0 ? 'R' : 'L'}`;
      this.group.add(stand);
    }
  }

  /**
   * 创建底盘氛围灯（漂移时发光）
   * @private
   */
  _createUnderGlow() {
    const glowMat = new THREE.MeshPhongMaterial({
      color: 0x00aaff,
      emissive: 0x00aaff,
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });

    const glowGeo = new THREE.PlaneGeometry(1.6, 3.6);
    this._underGlow = new THREE.Mesh(glowGeo, glowMat);
    this._underGlow.position.y = 0.02;
    this._underGlow.rotation.x = -Math.PI / 2;
    this._underGlow.name = 'underGlow';
    this.group.add(this._underGlow);
  }

  /**
   * 设置底盘氛围灯强度（漂移视觉反馈）
   * @param {number} intensity - 0~1 的发光强度
   */
  setGlowIntensity(intensity) {
    if (this._underGlow) {
      const mat = this._underGlow.material;
      mat.emissiveIntensity = intensity * 2;
      mat.opacity = intensity * 0.6;
    }
  }

  // ----------------------------------------------------------
  // 公开接口
  // ----------------------------------------------------------

  /**
   * 获取模型的 Three.js 对象（Group）
   * @returns {THREE.Group}
   */
  getObject() {
    return this.group;
  }

  /**
   * 根据物理状态更新模型位置和朝向
   *
   * 3D 坐标映射（物理引擎 Y 轴向上，赛车在 XZ 平面运动）：
   *   physics.position.x → THREE.x
   *   physics.position.z → THREE.z（注意：不是 physics.position.y）
   *   physics.angle → THREE.rotation.y
   *
   * @param {import('../types.js').CarEntity} carState - 物理引擎提供的赛车状态
   */
  updateFromPhysics(carState) {
    if (!carState) return;

    // 位置映射：physics {x, z} → 3D {x, 0, z}（physics.y 是高度，不使用）
    this.group.position.set(carState.position.x, 0, carState.position.z);

    // 朝向：物理 angle 为 0 时指向 +X，与模型默认朝向一致
    this.group.rotation.y = carState.angle;

    // 漂移时底盘发光
    if (carState.isDrifting) {
      this.setGlowIntensity(1.0);
    } else {
      this.setGlowIntensity(0);
    }
  }

  /**
   * 更新车轮旋转动画（基于车速）
   * @param {number} speed - 当前速率（米/秒）
   */
  updateWheelSpin(speed) {
    // 车轮旋转速度与车速成正比
    const spinSpeed = speed * 8;
    for (const wheel of this.wheels) {
      wheel.children[0].rotation.z += spinSpeed * 0.016; // ~60fps 归一化
      wheel.children[1].rotation.z += spinSpeed * 0.016;
    }
  }

  /**
   * 释放模型占用的 GPU 资源
   */
  dispose() {
    this.group.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => { m.dispose(); });
          } else {
            child.material.dispose();
          }
        }
      }
    });

    this.group.clear();
    this.wheels = [];
    this._underGlow = null;
  }
}
