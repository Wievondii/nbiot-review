/**
 * @file 第三人称摄像机控制器
 *
 * 实现 CameraController 接口：
 *   init(camera, target)  - 初始化摄像机与跟随目标
 *   update(dt, carState)  - 每帧更新摄像机位置（平滑跟随）
 *   setMode(mode)         - 切换视角模式
 *
 * 支持的视角模式：
 *   - chase（第三人称跟随）：摄像机在车辆后上方，平滑插值跟随
 *   - cockpit（驾驶舱）：摄像机在车内，第一人称视角
 *   - orbit（环绕）：摄像机绕车辆旋转，适合回放/展示
 *
 * 坐标系：Three.js 标准（Y 轴向上）
 * 2D→3D 映射：physics {x, y} → THREE {x, 0, z}（z = y）
 *
 * @module render/CameraController
 */

import * as THREE from 'three';

// ============================================================
// 视角参数
// ============================================================

/** 追逐视角：摄像机在目标后上方的偏移量 */
const CHASE_OFFSET = new THREE.Vector3(0, 4, -7);

/** 追逐视角：摄像机看向目标前方的偏移量（过弯时预判） */
const CHASE_LOOK_AHEAD = new THREE.Vector3(0, 0.5, 3);

/** 追逐视角：平滑插值速度（值越大跟随越快） */
const CHASE_LERP_SPEED = 3.0;

/** 追逐视角：默认视野角度 */
const CHASE_FOV = 65;

/** 驾驶舱视角：摄像机在引擎盖位置 */
const COCKPIT_OFFSET = new THREE.Vector3(0, 0.5, 1.2);

/** 驾驶舱视角：看向前方远处 */
const COCKPIT_LOOK_AHEAD = new THREE.Vector3(0, 0.2, 20);

/** 驾驶舱视角：视野角度（更宽，模拟人眼周边视觉） */
const COCKPIT_FOV = 80;

/** 环绕视角：摄像机与目标的距离 */
const ORBIT_DISTANCE = 8;

/** 环绕视角：摄像机高度 */
const ORBIT_HEIGHT = 3;

/** 环绕视角：环绕速度（弧度/秒） */
const ORBIT_SPEED = 0.5;

/** 最小摄像机高度（防止穿地） */
const MIN_CAMERA_HEIGHT = 0.5;

export class CameraController {
  constructor() {
    /** @type {THREE.PerspectiveCamera|null} */
    this.camera = null;

    /** @type {THREE.Object3D|null} 跟随目标（赛车模型 Group） */
    this.target = null;

    /** @type {'chase'|'cockpit'|'orbit'} 当前视角模式 */
    this.mode = 'chase';

    /** @type {THREE.Vector3} 当前平滑位置 */
    this._currentPos = new THREE.Vector3();

    /** @type {THREE.Vector3} 当前平滑注视点 */
    this._currentLookAt = new THREE.Vector3();

    /** @type {number} 初始 FOV（用于模式切换时恢复） */
    this._defaultFov = CHASE_FOV;

    /** @type {number} 环绕角度累积（环绕模式使用） */
    this._orbitAngle = 0;

    /** @type {boolean} 是否已初始化 */
    this._initialized = false;

    /** @type {import('../types.js').CarEntity|null} 上一帧赛车状态缓存 */
    this._lastCarState = null;
  }

  /**
   * 初始化摄像机控制器
   *
   * @param {THREE.PerspectiveCamera} camera - Three.js 透视摄像机
   * @param {THREE.Object3D} target - 跟随目标（通常是赛车模型的 Group）
   */
  init(camera, target) {
    this.camera = camera;
    this.target = target;
    this._defaultFov = camera.fov || CHASE_FOV;

    // 初始位置设置在目标后上方
    this._currentPos.copy(CHASE_OFFSET);
    this._currentLookAt.set(0, 0, 0);

    // 立即应用初始位置
    camera.position.copy(this._currentPos);
    camera.lookAt(this._currentLookAt);
    camera.fov = CHASE_FOV;
    camera.updateProjectionMatrix();

    this._initialized = true;

    if (window.DEBUG) {
      console.log('[CameraController] 初始化完成，模式: chase');
    }
  }

  /**
   * 每帧更新摄像机位置
   *
   * 根据当前模式计算目标摄像机位置，使用线性插值平滑过渡。
   *
   * @param {number} dt - 距上一帧的时间（秒）
   * @param {import('../types.js').CarEntity} carState - 物理引擎提供的赛车状态
   */
  update(dt, carState) {
    if (!this._initialized || !this.camera) return;

    // 缓存赛车状态
    this._lastCarState = carState;

    // 防止 dt 为 0 或负数
    const safeDt = Math.max(dt, 0.001);

    switch (this.mode) {
      case 'chase':
        this._updateChase(safeDt, carState);
        break;
      case 'cockpit':
        this._updateCockpit(safeDt, carState);
        break;
      case 'orbit':
        this._updateOrbit(safeDt, carState);
        break;
    }
  }

  /**
   * 切换视角模式
   *
   * @param {'chase'|'cockpit'|'orbit'} mode - 目标模式
   */
  setMode(mode) {
    if (mode === this.mode) return;
    if (!['chase', 'cockpit', 'orbit'].includes(mode)) {
      console.warn(`[CameraController] 未知视角模式: "${mode}"，忽略`);
      return;
    }

    const previousMode = this.mode;
    this.mode = mode;

    // 根据模式调整 FOV
    if (this.camera) {
      switch (mode) {
        case 'chase':
          this.camera.fov = CHASE_FOV;
          break;
        case 'cockpit':
          this.camera.fov = COCKPIT_FOV;
          break;
        case 'orbit':
          this.camera.fov = CHASE_FOV;
          break;
      }
      this.camera.updateProjectionMatrix();
    }

    // 立即重置平滑位置到新模式的目标位置（避免从远处飞入）
    if (this._lastCarState) {
      this._snapToTarget(this._lastCarState);
    }

    if (window.DEBUG) {
      console.log(`[CameraController] 模式切换: ${previousMode} → ${mode}`);
    }
  }

  // ----------------------------------------------------------
  // 模式更新：追逐视角
  // ----------------------------------------------------------

  /**
   * 更新追逐视角（第三人称跟随）
   *
   * 摄像机位于车辆后上方，平滑跟随。过弯时略微看向弯道前方。
   *
   * @private
   * @param {number} dt
   * @param {import('../types.js').CarEntity} carState
   */
  _updateChase(dt, carState) {
    if (!carState) return;

    // 计算目标的世界位置（2D→3D 映射）
    const targetPos = new THREE.Vector3(
      carState.position.x,
      0,
      carState.position.y
    );

    // 车辆朝向向量（物理 angle=0 指向 +X）
    const forward = new THREE.Vector3(
      Math.cos(carState.angle),
      0,
      Math.sin(carState.angle)
    );

    // 摄像机期望位置：在车辆后上方
    const desiredPos = targetPos.clone()
      .add(forward.clone().multiplyScalar(CHASE_OFFSET.z)) // 后方偏移
      .add(new THREE.Vector3(0, CHASE_OFFSET.y, 0));       // 上方偏移

    // 摄像机注视点：车辆前方（预判方向）
    const lookTarget = targetPos.clone()
      .add(forward.clone().multiplyScalar(CHASE_LOOK_AHEAD.z))
      .add(new THREE.Vector3(0, CHASE_LOOK_AHEAD.y, 0));

    // 平滑插值
    const lerpFactor = 1 - Math.exp(-CHASE_LERP_SPEED * dt);
    this._currentPos.lerp(desiredPos, lerpFactor);
    this._currentLookAt.lerp(lookTarget, lerpFactor);

    // 应用摄像机位置和朝向
    this.camera.position.copy(this._currentPos);
    this.camera.lookAt(this._currentLookAt);

    // 高度下限保护
    this.camera.position.y = Math.max(this.camera.position.y, MIN_CAMERA_HEIGHT);
  }

  // ----------------------------------------------------------
  // 模式更新：驾驶舱视角
  // ----------------------------------------------------------

  /**
   * 更新驾驶舱视角（第一人称）
   *
   * 摄像机位于车辆内部引擎盖位置，跟随车辆朝向。
   *
   * @private
   * @param {number} dt
   * @param {import('../types.js').CarEntity} carState
   */
  _updateCockpit(dt, carState) {
    if (!carState) return;

    const targetPos = new THREE.Vector3(
      carState.position.x,
      0,
      carState.position.y
    );

    const forward = new THREE.Vector3(
      Math.cos(carState.angle),
      0,
      Math.sin(carState.angle)
    );

    // 摄像机位置：在引擎盖位置
    const desiredPos = targetPos.clone()
      .add(forward.clone().multiplyScalar(COCKPIT_OFFSET.z))
      .add(new THREE.Vector3(0, COCKPIT_OFFSET.y, 0));

    // 看向前方远处
    const lookTarget = targetPos.clone()
      .add(forward.clone().multiplyScalar(COCKPIT_LOOK_AHEAD.z))
      .add(new THREE.Vector3(0, COCKPIT_LOOK_AHEAD.y, 0));

    // 平滑跟随（驾驶舱需要更快速的响应）
    const lerpFactor = 1 - Math.exp(-8 * dt);
    this._currentPos.lerp(desiredPos, lerpFactor);
    this._currentLookAt.lerp(lookTarget, lerpFactor);

    this.camera.position.copy(this._currentPos);
    this.camera.lookAt(this._currentLookAt);
  }

  // ----------------------------------------------------------
  // 模式更新：环绕视角
  // ----------------------------------------------------------

  /**
   * 更新环绕视角
   *
   * 摄像机围绕车辆旋转，适合回放或展示车辆外观。
   *
   * @private
   * @param {number} dt
   * @param {import('../types.js').CarEntity} carState
   */
  _updateOrbit(dt, carState) {
    if (!carState) return;

    // 累积环绕角度
    this._orbitAngle += ORBIT_SPEED * dt;

    const targetPos = new THREE.Vector3(
      carState.position.x,
      0,
      carState.position.y
    );

    // 计算环绕位置
    const desiredPos = targetPos.clone();
    desiredPos.x += Math.cos(this._orbitAngle) * ORBIT_DISTANCE;
    desiredPos.z += Math.sin(this._orbitAngle) * ORBIT_DISTANCE;
    desiredPos.y += ORBIT_HEIGHT;

    // 注视目标（车辆中心略上方）
    const lookTarget = targetPos.clone();
    lookTarget.y += 0.5;

    // 平滑插值
    const lerpFactor = 1 - Math.exp(-2 * dt);
    this._currentPos.lerp(desiredPos, lerpFactor);
    this._currentLookAt.lerp(lookTarget, lerpFactor);

    this.camera.position.copy(this._currentPos);
    this.camera.lookAt(this._currentLookAt);
  }

  // ----------------------------------------------------------
  // 工具方法
  // ----------------------------------------------------------

  /**
   * 立即将摄像机对准目标位置（无平滑过渡）
   * @private
   * @param {import('../types.js').CarEntity} carState
   */
  _snapToTarget(carState) {
    const targetPos = new THREE.Vector3(
      carState.position.x,
      0,
      carState.position.y
    );

    const forward = new THREE.Vector3(
      Math.cos(carState.angle),
      0,
      Math.sin(carState.angle)
    );

    // 根据当前模式计算快照位置
    switch (this.mode) {
      case 'chase':
      default:
        this._currentPos.copy(targetPos)
          .add(forward.clone().multiplyScalar(CHASE_OFFSET.z))
          .add(new THREE.Vector3(0, CHASE_OFFSET.y, 0));
        this._currentLookAt.copy(targetPos)
          .add(forward.clone().multiplyScalar(CHASE_LOOK_AHEAD.z))
          .add(new THREE.Vector3(0, CHASE_LOOK_AHEAD.y, 0));
        break;

      case 'cockpit':
        this._currentPos.copy(targetPos)
          .add(forward.clone().multiplyScalar(COCKPIT_OFFSET.z))
          .add(new THREE.Vector3(0, COCKPIT_OFFSET.y, 0));
        this._currentLookAt.copy(targetPos)
          .add(forward.clone().multiplyScalar(COCKPIT_LOOK_AHEAD.z))
          .add(new THREE.Vector3(0, COCKPIT_LOOK_AHEAD.y, 0));
        break;

      case 'orbit':
        this._currentPos.copy(targetPos);
        this._currentPos.x += Math.cos(this._orbitAngle) * ORBIT_DISTANCE;
        this._currentPos.z += Math.sin(this._orbitAngle) * ORBIT_DISTANCE;
        this._currentPos.y += ORBIT_HEIGHT;
        this._currentLookAt.copy(targetPos);
        this._currentLookAt.y += 0.5;
        break;
    }

    this.camera.position.copy(this._currentPos);
    this.camera.lookAt(this._currentLookAt);
  }

  /**
   * 重置环绕角度（切换回 orbit 模式时重置角度）
   */
  resetOrbitAngle() {
    this._orbitAngle = 0;
  }

  /**
   * 获取当前摄像机对象
   * @returns {THREE.PerspectiveCamera|null}
   */
  getCamera() {
    return this.camera;
  }

  /**
   * 获取当前视角模式
   * @returns {string}
   */
  getMode() {
    return this.mode;
  }
}
