/**
 * 3D 物理引擎核心模块
 *
 * 基于 Cannon-es 物理库。
 * 负责：
 * - 管理 CANNON.World（重力、宽相位、接触材质）
 * - 固定步长物理更新（accumulator 模式，1/60s）
 * - 赛车（CANNON.Body）的创建与状态查询
 * - 输入分发至 CarPhysics 模块
 * - 碰撞事件的收集与返回
 * - 赛道边界、地面的静态刚体管理
 *
 * 集成要求（接口调用关系表）：
 * - GameLoop.update(dt) 每帧调用 update(dt)
 * - GameLoop 在 update 后调用 checkCollisions() 获取碰撞事件
 * - GameLoop.render() 调用 getCarState(id) 获取赛车位置/旋转
 * - TrackLoader 加载赛道后调用 addBarrier() 创建边界
 * - GameLoop 调用 setCarLap() / setCarCheckpoint() 更新圈数
 *
 * 坐标系：Y 轴向上，Z 轴为赛车前进方向
 * 物理量：国际单位制（米、秒、千克）
 *
 * @module PhysicsEngine3D
 */

import * as CANNON from 'cannon-es';
import { CarPhysics } from './CarPhysics.js';
import {
  setupCollisionHandling,
  createGroundBody,
  createBarrierBody,
  setupCarCollision,
  collectCollisionEvents,
} from './Collision.js';

// ============================================================
// 物理常量
// ============================================================

/** 固定物理时间步长（秒） */
const FIXED_DT = 1 / 60;

/** 最大累积时间（秒），防止帧率过低时物理崩溃（spiral of death） */
const MAX_ACCUMULATOR = 0.1;

/** 重力加速度（m/s²） */
const GRAVITY = -9.82;

/** 赛车质量（千克） */
const CAR_MASS = 1000;

/** 赛车碰撞箱半宽（米） */
const CAR_HALF_WIDTH = 0.9;

/** 赛车碰撞箱半长（米） */
const CAR_HALF_LENGTH = 2.0;

/** 赛车碰撞箱半高（米） */
const CAR_HALF_HEIGHT = 0.4;

/** 最大速度（m/s），约 288 km/h */
const MAX_SPEED = 80;

// ============================================================
// PhysicsEngine3D 类
// ============================================================

export class PhysicsEngine3D {
  constructor() {
    /** @type {CANNON.World | null} */
    this.world = null;

    /** @type {Map<string, CarPhysics>} carId → CarPhysics */
    this._carPhysics = new Map();

    /** @type {Map<string, CANNON.Body>} carId → CANNON.Body */
    this._bodies = new Map();

    /** @type {Map<string, Object>} carId → 自定义数据（圈数、检查点等） */
    this._carData = new Map();

    /** 时间累积器（秒） */
    this._accumulator = 0;

    /** 总运行时间（秒） */
    this._totalTime = 0;

    /** 是否已添加地面 */
    this._hasGround = false;
  }

  // ----------------------------------------------------------
  // 生命周期
  // ----------------------------------------------------------

  /**
   * 初始化物理引擎
   *
   * 创建 CANNON.World，设置重力、宽相位算法、碰撞处理。
   * 在游戏启动时由 GameLoop 调用一次。
   */
  init() {
    // 创建物理世界
    this.world = new CANNON.World();
    this.world.gravity.set(0, GRAVITY, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;
    this.world.allowSleep = true;

    // 设置碰撞处理（材质 + 事件监听）
    setupCollisionHandling(this.world, (event) => {
      // 碰撞事件的即时回调（可在此处触发音效等）
      if (typeof this._onCollisionCb === 'function') {
        this._onCollisionCb(event);
      }
    });

    // 重置状态
    this._carPhysics.clear();
    this._bodies.clear();
    this._carData.clear();
    this._accumulator = 0;
    this._totalTime = 0;
    this._hasGround = false;
    this._onCollisionCb = null;

    // 创建默认地面
    createGroundBody(this.world, 0);

    return this;
  }

  /**
   * 注册碰撞事件回调
   *
   * @param {Function} cb - (event) => void
   */
  onCollision(cb) {
    this._onCollisionCb = cb;
  }

  // ----------------------------------------------------------
  // 主更新循环
  // ----------------------------------------------------------

  /**
   * 物理更新入口（每帧由 GameLoop 调用）
   *
   * 使用 accumulator 模式将可变帧率转换为固定步长更新。
   * 在循环中先调用 carPhysics.step() 消费输入，再 world.step() 步进物理。
   *
   * @param {number} dt - 距上一帧的时间（秒）
   */
  update(dt) {
    if (!this.world) return;

    this._accumulator += dt;

    // 防螺旋死亡：累积时间上限
    if (this._accumulator > MAX_ACCUMULATOR) {
      this._accumulator = MAX_ACCUMULATOR;
    }

    // 按固定步长消费累积时间
    while (this._accumulator >= FIXED_DT) {
      // 第一步：应用所有赛车的物理输入（力、扭矩）
      for (const [, cp] of this._carPhysics) {
        cp.step(FIXED_DT);
      }

      // 第二步：步进 Cannon-es 物理世界
      this.world.step(FIXED_DT, FIXED_DT, 3);

      this._accumulator -= FIXED_DT;
      this._totalTime += FIXED_DT;
    }
  }

  // ----------------------------------------------------------
  // 赛车管理
  // ----------------------------------------------------------

  /**
   * 创建一辆赛车
   *
   * 创建 Cannon-es 刚体（盒体碰撞箱）、CarPhysics 实例，
   * 并在世界中进行注册。
   *
   * @param {Object} config - 赛车配置
   * @param {string} config.id - 唯一标识
   * @param {{ x: number, y: number, z: number }} config.position - 初始位置
   * @param {number} [config.angle] - 初始偏航角（弧度）
   * @param {{ x?: number, y?: number, z?: number }} [config.rotation] - 初始欧拉角
   * @returns {Object|null} CarEntity 或 null
   */
  createCar(config) {
    if (!this.world) {
      console.error('[PhysicsEngine3D] 引擎未初始化，请先调用 init()');
      return null;
    }
    if (this._bodies.has(config.id)) {
      console.warn(`[PhysicsEngine3D] 赛车 "${config.id}" 已存在，跳过创建`);
      return this.getCarState(config.id);
    }

    // ---- 创建 Cannon-es 刚体 ----
    const body = new CANNON.Body({
      mass: CAR_MASS,
      shape: new CANNON.Box(
        new CANNON.Vec3(CAR_HALF_WIDTH, CAR_HALF_HEIGHT, CAR_HALF_LENGTH)
      ),
      position: new CANNON.Vec3(
        config.position.x,
        config.position.y ?? 0.5,
        config.position.z
      ),
    });

    // 设置初始朝向
    if (config.rotation) {
      body.quaternion.setFromEuler(
        config.rotation.x ?? 0,
        config.rotation.y ?? 0,
        config.rotation.z ?? 0
      );
    } else if (config.angle !== undefined) {
      // 兼容 2D 角度（偏航），转换为四元数
      body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), config.angle);
    }

    // 物理阻尼
    body.linearDamping = 0.05;
    body.angularDamping = 0.3;

    // 标记为赛车刚体
    body.__carId = config.id;

    // 设置碰撞组
    setupCarCollision(body, this.world);

    // ---- 添加到世界 ----
    this.world.addBody(body);
    this._bodies.set(config.id, body);

    // ---- 创建 CarPhysics 实例 ----
    const carPhysics = new CarPhysics(body, config);
    this._carPhysics.set(config.id, carPhysics);

    // ---- 自定义数据（圈数等） ----
    this._carData.set(config.id, {
      lap: 0,
      checkpoint: 0,
    });

    return this.getCarState(config.id);
  }

  /**
   * 移除一辆赛车
   *
   * @param {string} carId
   */
  removeCar(carId) {
    const body = this._bodies.get(carId);
    if (body && this.world) {
      this.world.removeBody(body);
    }
    this._bodies.delete(carId);
    this._carPhysics.delete(carId);
    this._carData.delete(carId);
  }

  // ----------------------------------------------------------
  // 输入接口
  // ----------------------------------------------------------

  /**
   * 对赛车施加输入状态
   *
   * @param {string} carId - 赛车 ID
   * @param {import('../types.js').InputState} input - 输入状态
   */
  applyInput(carId, input) {
    const cp = this._carPhysics.get(carId);
    if (!cp) return;
    cp.applyInput(input);
  }

  // ----------------------------------------------------------
  // 状态查询
  // ----------------------------------------------------------

  /**
   * 获取赛车状态（CarEntity 格式）
   *
   * @param {string} carId - 赛车 ID
   * @returns {Object|null} CarEntity
   */
  getCarState(carId) {
    const body = this._bodies.get(carId);
    if (!body) return null;

    const data = this._carData.get(carId) || {};
    const vel = body.velocity;
    const speed = Math.min(vel.length(), MAX_SPEED);

    // 计算档位和 RPM
    const gear = CarPhysics.computeGear(speed);
    const rpm = CarPhysics.computeRPM(speed, gear);

    // 获取 CarPhysics 的漂移状态
    const cp = this._carPhysics.get(carId);
    const isDrifting = cp ? cp.isDrifting() : false;

    // 计算欧拉角（用于 rotation 字段和兼容的 angle 字段）
    const euler = this._quatToEuler(body.quaternion);
    // yaw 角（绕 Y 轴），兼容旧版 carState.angle 使用
    const yaw = euler.z;

    return {
      id: carId,
      position: {
        x: body.position.x,
        y: body.position.y,
        z: body.position.z,
      },
      velocity: {
        x: vel.x,
        y: vel.y,
        z: vel.z,
      },
      rotation: euler,
      /** @deprecated 使用 rotation.y 代替，保留以兼容 CameraController 和 CarModel */
      angle: yaw,
      speed,
      gear,
      rpm,
      isDrifting,
      lap: data.lap ?? 0,
      checkpoint: data.checkpoint ?? 0,
    };
  }

  /**
   * 获取所有赛车的状态
   *
   * @returns {Object[]} CarEntity 数组
   */
  getAllCarStates() {
    const states = [];
    for (const [id] of this._bodies) {
      const state = this.getCarState(id);
      if (state) states.push(state);
    }
    return states;
  }

  // ----------------------------------------------------------
  // 碰撞
  // ----------------------------------------------------------

  /**
   * 获取并清空累积的碰撞事件
   *
   * @returns {Object[]} CollisionEvent 数组
   */
  checkCollisions() {
    if (!this.world) return [];
    return collectCollisionEvents(this.world);
  }

  // ----------------------------------------------------------
  // 赛道边界管理
  // ----------------------------------------------------------

  /**
   * 添加赛道边界刚体
   *
   * @param {Object} config - { position, size, rotation }
   * @param {{ x:number, y:number, z:number }} config.position
   * @param {{ x:number, y:number, z:number }} config.size
   * @param {number} [config.rotation=0] - 绕 Y 轴偏航角
   * @returns {CANNON.Body|null}
   */
  addBarrier(config) {
    if (!this.world) return null;
    return createBarrierBody(this.world, config);
  }

  /**
   * 批量添加赛道边界
   *
   * @param {Array<{ position: Object, size: Object, rotation?: number }>} barriers
   */
  addBarriers(barriers) {
    for (const b of barriers) {
      this.addBarrier(b);
    }
  }

  // ----------------------------------------------------------
  // 赛车数据更新（由 TrackManager/GameLoop 调用）
  // ----------------------------------------------------------

  /**
   * 设置赛车圈数
   *
   * @param {string} carId
   * @param {number} lap
   */
  setCarLap(carId, lap) {
    const data = this._carData.get(carId);
    if (data) data.lap = lap;
  }

  /**
   * 设置赛车检查点
   *
   * @param {string} carId
   * @param {number} checkpoint
   */
  setCarCheckpoint(carId, checkpoint) {
    const data = this._carData.get(carId);
    if (data) data.checkpoint = checkpoint;
  }

  // ----------------------------------------------------------
  // 重置
  // ----------------------------------------------------------

  /**
   * 重置物理引擎（清除所有刚体，重置累加器）
   */
  reset() {
    if (this.world) {
      // 清除所有刚体
      const bodies = this.world.bodies.slice();
      for (const body of bodies) {
        this.world.removeBody(body);
      }
    }

    this._carPhysics.clear();
    this._bodies.clear();
    this._carData.clear();
    this._accumulator = 0;
    this._totalTime = 0;
    this._hasGround = false;
    this._onCollisionCb = null;
  }

  /**
   * 获取物理引擎总运行时间
   *
   * @returns {number}
   */
  getTotalTime() {
    return this._totalTime;
  }

  // ----------------------------------------------------------
  // 内部辅助
  // ----------------------------------------------------------

  /**
   * 将四元数转换为欧拉角（XYZ 顺序）
   *
   * @param {CANNON.Quaternion} q
   * @returns {{ x: number, y: number, z: number }}
   */
  _quatToEuler(q) {
    // 四元数 → 欧拉角 (XYZ 顺序)
    const x = q.x;
    const y = q.y;
    const z = q.z;
    const w = q.w;

    const roll = Math.atan2(
      2 * (w * x + y * z),
      1 - 2 * (x * x + y * y)
    );

    const sinp = 2 * (w * y - z * x);
    const pitch =
      Math.abs(sinp) >= 1
        ? (Math.PI / 2) * Math.sign(sinp)
        : Math.asin(sinp);

    const yaw = Math.atan2(
      2 * (w * z + x * y),
      1 - 2 * (y * y + z * z)
    );

    return { x: roll, y: pitch, z: yaw };
  }
}

// ============================================================
// 导出常量
// ============================================================

export { FIXED_DT, MAX_ACCUMULATOR };
