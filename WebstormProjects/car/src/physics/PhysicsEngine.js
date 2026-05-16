/**
 * 物理引擎核心模块
 *
 * 基于固定时间步长（1/60s）的物理更新系统。
 * 负责：
 * - 用 accumulator 模式将可变帧率转换为固定步长更新
 * - 将输入状态转换为引擎力、刹车力和转向扭矩
 * - 计算空气阻力、纵向/侧向摩擦力
 * - 管理漂移状态
 * - 提供赛车状态给其他模块
 *
 * 集成要求（接口调用关系表）：
 * - GameLoop.update() 每帧调用 update(dt, inputState)
 * - GameLoop.render() 后调用 checkCollisions()
 * - RenderEngine 每帧调用 getCarState(id) 获取赛车位置
 * - InputController 可调用 applyForce/applyTorque（外部事件）
 *
 * 坐标系：Y轴向上为正，X轴向右为正
 * 角度：弧度制，0度指向X轴正方向，逆时针为正
 * 物理量：国际单位制（米、秒、米/秒）
 *
 * @module PhysicsEngine
 */

import { updateDriftState } from './Drift.js';
import {
  checkCarBarrierCollisions,
  checkCarCarCollisions,
  resolveCollision,
  buildBarrierGrid,
} from './Collision.js';

// ============================================================
// 物理常量
// ============================================================

/** 固定物理时间步长（秒） */
export const FIXED_DT = 1 / 60;

/** 最大累积时间（秒），防止帧率过低时物理崩溃（spiral of death） */
export const MAX_ACCUMULATOR = 0.1;

/** 赛车质量（千克） */
const CAR_MASS = 1000;

/** 赛车转动惯量（kg·m²） */
const CAR_INERTIA = 500;

/** 赛车碰撞箱半宽（米） */
const CAR_HALF_WIDTH = 0.9;

/** 赛车碰撞箱半长（米） */
const CAR_HALF_LENGTH = 2.0;

/** 最大引擎推进力（牛） */
const ENGINE_FORCE = 8000;

/** 最大刹车力（牛） */
const BRAKE_FORCE = 12000;

/** 空气阻力系数 */
const DRAG_COEFFICIENT = 2.5;

/** 滚动摩擦 / 纵向摩擦系数 */
const LONGITUDINAL_FRICTION = 0.8;

/** 侧向抓地力系数（高值=不易侧滑） */
const LATERAL_FRICTION = 5.0;

/** 基础转向扭矩（牛·米） */
const TURN_TORQUE = 4000;

/** 角速度阻尼系数（每帧衰减比例） */
const ANGULAR_DAMPING = 0.1;

// ============================================================
// 赛车内部状态
// ============================================================

/**
 * 创建赛车内部状态
 *
 * 区别于对外暴露的 CarEntity，内部状态包含物理模拟所需的全部属性。
 *
 * @param {Object} config - { id, position, angle }
 * @returns {Object} 赛车内部状态对象
 */
function createCar(config) {
  return {
    // ---- 物理属性 ----
    id: config.id,
    position: { x: config.position.x, y: config.position.y },
    velocity: { x: 0, y: 0 },
    angle: config.angle ?? 0,
    angularVelocity: 0,

    // ---- 物理参量 ----
    mass: CAR_MASS,
    inertia: CAR_INERTIA,
    halfWidth: CAR_HALF_WIDTH,
    halfLength: CAR_HALF_LENGTH,

    // ---- 力的累加器（每帧重置） ----
    forceAccumulator: { x: 0, y: 0 },
    torqueAccumulator: 0,

    // ---- 漂移状态 ----
    driftState: {
      isDrifting: false,
      driftAngle: 0,
      duration: 0,
    },

    // ---- 公开可见状态（由物理引擎维护） ----
    speed: 0,
    isDrifting: false,

    // ---- 圈数和检查点（由 GameLoop/TrackManager 设置） ----
    lap: 0,
    checkpoint: 0,
  };
}

// ============================================================
// PhysicsEngine 类
// ============================================================

export class PhysicsEngine {
  constructor() {
    /** @type {Map<string, Object>} 赛车内部状态映射 */
    this.cars = new Map();

    /** @type {Object[]} 赛道边界 */
    this.barriers = [];

    /** @type {import('../Collision.js').SpatialGrid | null} 空间网格 */
    this.barrierGrid = null;

    /** 时间累积器（秒） */
    this.accumulator = 0;

    /** 总运行时间（秒） */
    this.totalTime = 0;

    /**
     * 漂移事件队列
     * update() 过程中检测漂移状态变化，存入此队列
     * GameLoop 通过 consumeDriftEvents() 消费并发射 EventBus 事件
     * @type {{ type: 'drift_start' | 'drift_end', carId: string }[]}
     */
    this._driftEvents = [];
  }

  // ----------------------------------------------------------
  // 生命周期
  // ----------------------------------------------------------

  /**
   * 初始化物理引擎
   *
   * @param {Object[]} carConfigs - 赛车配置数组
   *   [{ id: string, position: Vector2D, angle?: number }]
   * @param {Object[]} barriers - 赛道边界（多边形数组）
   */
  init(carConfigs, barriers) {
    this.cars.clear();
    for (const config of carConfigs) {
      this.cars.set(config.id, createCar(config));
    }
    this.setBarriers(barriers);
    this.accumulator = 0;
    this.totalTime = 0;
    this._driftEvents = [];
  }

  // ----------------------------------------------------------
  // 主更新循环
  // ----------------------------------------------------------

  /**
   * 物理更新入口（每帧由 GameLoop 调用）
   *
   * 使用 accumulator 模式将可变帧率转换为固定步长更新。
   *
   * @param {number} dt - 距上一帧的时间（秒），来自 requestAnimationFrame
   * @param {Object} inputState - 当前帧输入状态
   *   { throttle: number, brake: number, steer: number, drift: boolean }
   */
  update(dt, inputState) {
    this.accumulator += dt;

    // 防螺旋死亡：累积时间上限
    if (this.accumulator > MAX_ACCUMULATOR) {
      this.accumulator = MAX_ACCUMULATOR;
    }

    // 按固定步长消费累积时间
    while (this.accumulator >= FIXED_DT) {
      this.step(inputState);
      this.accumulator -= FIXED_DT;
      this.totalTime += FIXED_DT;
    }
  }

  /**
   * 单步物理更新（固定步长 1/60s）
   *
   * 每辆赛车的更新顺序：
   * 1. 应用控制力（油门/刹车/转向）
   * 2. 更新漂移状态
   * 3. 分解速度并应用摩擦力
   * 4. 应用空气阻力
   * 5. 半隐式欧拉积分（更新速度/位置/角度）
   * 6. 更新公开状态字段
   * 7. 重置力累加器
   *
   * @param {Object} inputState
   */
  step(inputState) {
    for (const [, car] of this.cars) {
      this.updateCar(car, inputState, FIXED_DT);
    }
  }

  // ----------------------------------------------------------
  // 单辆赛车物理更新
  // ----------------------------------------------------------

  /**
   * @param {Object} car - 赛车内部状态
   * @param {Object} input - 输入状态
   * @param {number} dt - 固定步长
   */
  updateCar(car, input, dt) {
    // ---- 方向向量 ----
    const forward = { x: Math.cos(car.angle), y: Math.sin(car.angle) };
    const lateral = { x: -Math.sin(car.angle), y: Math.cos(car.angle) };

    // ============================================================
    // 1. 应用控制力（油门/刹车 → 沿车身方向推进/制动）
    // ============================================================
    let engineForceMag = 0;

    if (input.throttle > 0) {
      engineForceMag += input.throttle * ENGINE_FORCE;
    }
    if (input.brake > 0) {
      // 刹车力与速度方向相反
      const speedSign =
        forward.x * car.velocity.x + forward.y * car.velocity.y >= 0 ? 1 : -1;
      engineForceMag -= input.brake * BRAKE_FORCE * speedSign;
    }

    this.applyForce(car.id, {
      x: forward.x * engineForceMag,
      y: forward.y * engineForceMag,
    });

    // ============================================================
    // 2. 转向扭矩
    // ============================================================
    const steerInput = input.steer;
    const baseTorque = steerInput * TURN_TORQUE;
    this.applyTorque(car.id, baseTorque);

    // ============================================================
    // 3. 漂移更新 & 状态变化检测
    // ============================================================
    // 记录漂移前状态，以便检测变化
    const wasDrifting = car.driftState.isDrifting;

    const driftResult = updateDriftState(car, input, dt);

    // 检测漂移状态变化 → 记录漂移事件（供 GameLoop 通过 EventBus 发射）
    if (wasDrifting !== car.driftState.isDrifting) {
      this._driftEvents.push({
        type: car.driftState.isDrifting ? 'drift_start' : 'drift_end',
        carId: car.id,
      });
    }

    // 漂移时额外施加转向扭矩（甩尾效果）
    if (driftResult.extraTorqueMultiplier > 0) {
      const driftTorque =
        steerInput * TURN_TORQUE * driftResult.extraTorqueMultiplier;
      this.applyTorque(car.id, driftTorque);
    }

    // ============================================================
    // 4. 速度分解与摩擦
    // ============================================================
    // 将速度分解为纵向和侧向分量
    const fwdSpeed = dot(car.velocity, forward);
    const latSpeed = dot(car.velocity, lateral);

    // 选择侧向摩擦系数（漂移时降低）
    const latFrictionCoeff =
      driftResult.lateralFriction !== null
        ? driftResult.lateralFriction
        : LATERAL_FRICTION;

    // 侧向摩擦力（抵抗侧滑）
    const latFrictionForce = -latSpeed * latFrictionCoeff * car.mass;
    this.applyForce(car.id, {
      x: lateral.x * latFrictionForce,
      y: lateral.y * latFrictionForce,
    });

    // 纵向摩擦力（滚动阻力）
    const longFrictionForce = -fwdSpeed * LONGITUDINAL_FRICTION * car.mass;
    this.applyForce(car.id, {
      x: forward.x * longFrictionForce,
      y: forward.y * longFrictionForce,
    });

    // ============================================================
    // 5. 空气阻力 F_drag = -dragCoeff * v * |v|
    // ============================================================
    const speed = lengthOf(car.velocity);
    if (speed > 0.01) {
      const dragMag = -DRAG_COEFFICIENT * speed;
      this.applyForce(car.id, {
        x: (car.velocity.x / speed) * dragMag,
        y: (car.velocity.y / speed) * dragMag,
      });
    }

    // ============================================================
    // 6. 半隐式欧拉积分
    // ============================================================
    // 先用累积的力计算加速度 → 更新速度
    const accel = {
      x: car.forceAccumulator.x / car.mass,
      y: car.forceAccumulator.y / car.mass,
    };
    car.velocity.x += accel.x * dt;
    car.velocity.y += accel.y * dt;

    // 角加速度 → 角速度
    const angAccel = car.torqueAccumulator / car.inertia;
    car.angularVelocity += angAccel * dt;

    // 角速度阻尼（转向系统摩擦）
    car.angularVelocity *= 1 - ANGULAR_DAMPING * dt * 60;

    // 用更新后的速度更新位置和角度
    car.position.x += car.velocity.x * dt;
    car.position.y += car.velocity.y * dt;
    car.angle += car.angularVelocity * dt;

    // 归一化角度到 [0, 2π)
    car.angle = car.angle % (Math.PI * 2);
    if (car.angle < 0) car.angle += Math.PI * 2;

    // ============================================================
    // 7. 重置力累加器
    // ============================================================
    car.forceAccumulator.x = 0;
    car.forceAccumulator.y = 0;
    car.torqueAccumulator = 0;

    // ============================================================
    // 8. 更新公开可见字段
    // ============================================================
    car.speed = lengthOf(car.velocity);
    car.isDrifting = car.driftState.isDrifting;
  }

  // ----------------------------------------------------------
  // 外力接口
  // ----------------------------------------------------------

  /**
   * 对赛车施加力（用于外部模块，如碰撞响应）
   *
   * @param {string} carId - 赛车 ID
   * @param {Vector2D} force - 力向量（牛）
   */
  applyForce(carId, force) {
    const car = this.cars.get(carId);
    if (!car) return;
    car.forceAccumulator.x += force.x;
    car.forceAccumulator.y += force.y;
  }

  /**
   * 对赛车施加扭矩（用于外部模块）
   *
   * @param {string} carId - 赛车 ID
   * @param {number} torque - 扭矩（牛·米），正=逆时针
   */
  applyTorque(carId, torque) {
    const car = this.cars.get(carId);
    if (!car) return;
    car.torqueAccumulator += torque;
  }

  // ----------------------------------------------------------
  // 碰撞检测
  // ----------------------------------------------------------

  /**
   * 执行碰撞检测并处理碰撞响应
   *
   * 检测顺序：
   * 1. 每辆赛车与附近赛道边界的碰撞（空间网格优化）
   * 2. 赛车与赛车之间的碰撞
   *
   * 碰撞响应：位置修正 + 速度反弹 + 角速度衰减
   *
   * @returns {import('../Collision.js').CollisionEvent[]} 碰撞事件数组
   */
  checkCollisions() {
    const events = [];

    // ---- 赛车 vs 赛道边界 ----
    for (const [, car] of this.cars) {
      const carEvents = checkCarBarrierCollisions(
        car,
        this.barriers,
        this.barrierGrid
      );
      for (const event of carEvents) {
        resolveCollision(car, event.collision);
        events.push(event);
      }
    }

    // ---- 赛车 vs 赛车 ----
    const carArray = Array.from(this.cars.values());
    for (let i = 0; i < carArray.length; i++) {
      for (let j = i + 1; j < carArray.length; j++) {
        const event = checkCarCarCollisions(carArray[i], carArray[j]);
        if (event) {
          // 两车各承担一半的碰撞响应
          const massRatio = carArray[j].mass / (carArray[i].mass + carArray[j].mass);
          resolveCollision(carArray[i], event.collision, massRatio);
          resolveCollision(carArray[j], event.collision, 1 - massRatio);
          events.push(event);
        }
      }
    }

    return events;
  }

  // ----------------------------------------------------------
  // 漂移事件消费
  // ----------------------------------------------------------

  /**
   * 获取并清空漂移事件队列
   *
   * 由 GameLoop 在 update() 之后调用，通过 EventBus 发射事件：
   *   - 'drift_start' → AudioManager.playDrift()
   *   - 'drift_end'   → 停止漂移音效（由 AudioManager 处理）
   *
   * @returns {{ type: 'drift_start' | 'drift_end', carId: string }[]}
   */
  consumeDriftEvents() {
    const events = this._driftEvents;
    this._driftEvents = [];
    return events;
  }

  // ----------------------------------------------------------
  // 状态查询
  // ----------------------------------------------------------

  /**
   * 获取赛车的公开状态（符合 CarEntity 接口定义）
   *
   * @param {string} carId - 赛车 ID
   * @returns {import('../types.js').CarEntity | null}
   */
  getCarState(carId) {
    const car = this.cars.get(carId);
    if (!car) return null;

    return {
      id: car.id,
      position: { x: car.position.x, y: car.position.y },
      velocity: { x: car.velocity.x, y: car.velocity.y },
      angle: car.angle,
      angularVelocity: car.angularVelocity,
      speed: car.speed,
      isDrifting: car.isDrifting,
      lap: car.lap,
      checkpoint: car.checkpoint,
    };
  }

  /**
   * 获取所有赛车的状态
   * @returns {import('../types.js').CarEntity[]}
   */
  getAllCarStates() {
    const states = [];
    for (const [id] of this.cars) {
      states.push(this.getCarState(id));
    }
    return states;
  }

  // ----------------------------------------------------------
  // 赛道相关
  // ----------------------------------------------------------

  /**
   * 设置赛道边界并重建空间网格
   * @param {Object[]} barriers
   */
  setBarriers(barriers) {
    this.barriers = barriers;
    this.barrierGrid = barriers.length > 0
      ? buildBarrierGrid(barriers, 20)
      : null;
  }

  /**
   * 设置赛车圈数（由 TrackManager 调用）
   * @param {string} carId
   * @param {number} lap
   */
  setCarLap(carId, lap) {
    const car = this.cars.get(carId);
    if (car) car.lap = lap;
  }

  /**
   * 设置赛车检查点（由 TrackManager 调用）
   * @param {string} carId
   * @param {number} checkpoint
   */
  setCarCheckpoint(carId, checkpoint) {
    const car = this.cars.get(carId);
    if (car) car.checkpoint = checkpoint;
  }

  // ----------------------------------------------------------
  // 重置
  // ----------------------------------------------------------

  /**
   * 重置物理引擎状态
   */
  reset() {
    this.accumulator = 0;
    this.totalTime = 0;
    this._driftEvents = [];
    this.cars.clear();
    this.barriers = [];
    this.barrierGrid = null;
  }
}

// ============================================================
// 向量工具（内部使用，避免循环引用）
// ============================================================

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function lengthOf(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}
