/**
 * 漂移物理模块
 *
 * 负责漂移的触发、维持和结束逻辑。
 * 漂移参数全部提取为可配置常量，方便后续调优。
 *
 * 漂移机制：
 * 1. 触发条件：高速（>MIN_SPEED）+ 转向输入（>MIN_STEER）+ 漂移按钮
 * 2. 漂移中：侧向摩擦力降低、转向灵敏度提高
 * 3. 结束条件：松开漂移键 / 速度过低 / 回正后持续一段时间
 *
 * @module Drift
 */

/**
 * 漂移参数配置
 * 所有数值均可调优
 */
export const DRIFT_PARAMS = {
  /** 触发漂移的最低速度（m/s） */
  MIN_SPEED: 10,

  /** 触发漂移的最小转向输入（0-1） */
  MIN_STEER: 0.3,

  /** 漂移最短持续时间（s），防止抖动 */
  MIN_DURATION: 0.15,

  /** 漂移时的侧向摩擦系数（比正常值低，让车侧滑） */
  LATERAL_FRICTION_DRIFT: 1.5,

  /** 漂移时的转向灵敏度倍率 */
  STEER_MULTIPLIER: 1.8,

  /** 漂移时额外施加的扭矩倍率（叠加在基础扭矩上） */
  EXTRA_TORQUE_MULTIPLIER: 0.6,

  /** 碰撞时的速度保留比例（0-1）, 1=完全弹性 */
  COLLISION_BOUNCE: 0.3,

  /** 碰撞时角速度衰减比例 */
  COLLISION_SPIN_DAMP: 0.5,
};

/**
 * 判断是否可以触发漂移
 * @param {Object} car - 赛车内部状态
 * @param {Object} input - 输入状态 { throttle, brake, steer, drift }
 * @returns {boolean}
 */
export function canStartDrift(car, input) {
  const speed = Math.sqrt(
    car.velocity.x * car.velocity.x + car.velocity.y * car.velocity.y
  );
  return (
    input.drift &&
    speed > DRIFT_PARAMS.MIN_SPEED &&
    Math.abs(input.steer) > DRIFT_PARAMS.MIN_STEER
  );
}

/**
 * 判断漂移是否可以结束
 * @param {Object} car - 赛车内部状态
 * @param {Object} input - 输入状态
 * @returns {boolean}
 */
export function canEndDrift(car, input) {
  const speed = Math.sqrt(
    car.velocity.x * car.velocity.x + car.velocity.y * car.velocity.y
  );

  // 松开漂移键 → 结束
  if (!input.drift) return true;

  // 速度太低 → 结束
  if (speed < DRIFT_PARAMS.MIN_SPEED * 0.5) return true;

  // 回正方向且漂移已持续足够久 → 结束
  if (
    Math.abs(input.steer) < 0.1 &&
    car.driftState.duration > DRIFT_PARAMS.MIN_DURATION
  ) {
    return true;
  }

  return false;
}

/**
 * 开始漂移
 * @param {Object} car - 赛车内部状态（会被修改）
 */
export function startDrift(car) {
  car.driftState.isDrifting = true;
  car.driftState.duration = 0;
  car.driftState.driftAngle = car.angle;
}

/**
 * 结束漂移，恢复抓地力
 * @param {Object} car - 赛车内部状态（会被修改）
 */
export function endDrift(car) {
  car.driftState.isDrifting = false;
  car.driftState.duration = 0;
  car.driftState.driftAngle = 0;
}

/**
 * 更新漂移状态（每帧调用一次）
 *
 * 1. 检查是否触发/结束漂移
 * 2. 更新漂移持续时间
 * 3. 返回当前漂移状态给物理引擎使用
 *
 * @param {Object} car - 赛车内部状态（会被修改）
 * @param {Object} input - 输入状态 { steer, drift }
 * @param {number} dt - 固定时间步长（秒）
 * @returns {{ isDrifting: boolean, lateralFriction: number, steerMultiplier: number }}
 */
export function updateDriftState(car, input, dt) {
  if (!car.driftState.isDrifting) {
    // 尝试触发漂移
    if (canStartDrift(car, input)) {
      startDrift(car);
    }
  } else {
    // 漂移中，累加持续时间
    car.driftState.duration += dt;

    // 尝试结束漂移
    if (canEndDrift(car, input)) {
      endDrift(car);
    }
  }

  const isDrifting = car.driftState.isDrifting;

  return {
    isDrifting,
    /** 侧向摩擦系数（漂移时降低） */
    lateralFriction: isDrifting
      ? DRIFT_PARAMS.LATERAL_FRICTION_DRIFT
      : null, // null = 使用物理引擎默认值

    /** 转向灵敏度倍率（漂移时增大） */
    steerMultiplier: isDrifting ? DRIFT_PARAMS.STEER_MULTIPLIER : 1.0,

    /** 额外漂移扭矩倍率 */
    extraTorqueMultiplier: isDrifting
      ? DRIFT_PARAMS.EXTRA_TORQUE_MULTIPLIER
      : 0,
  };
}
