/**
 * 检查点系统
 * @module track/Checkpoint
 *
 * 功能：
 * - 检测赛车是否通过检查点（线段相交检测）
 * - 强制按顺序通过检查点（防作弊）
 * - 记录当前圈数
 * - 完成所有圈数时触发完成事件
 */
export class CheckpointSystem {
  constructor() {
    /** @type {object|null} 当前赛道数据 */
    this._track = null;

    /** @type {Array<{a: Vector2D, b: Vector2D, center: Vector2D}>} 每个检查点的线段 */
    this._cpSegments = [];

    /** @type {Map<string, CarCheckpointState>} */
    this._carStates = new Map();

    /** @type {Function|null} */
    this._onCheckpointPassed = null;

    /** @type {Function|null} */
    this._onLapComplete = null;

    /** @type {Function|null} */
    this._onRaceComplete = null;
  }

  /**
   * 初始化检查点系统
   * @param {object} trackData - 符合 TrackData 接口的数据
   */
  init(trackData) {
    if (!trackData || !Array.isArray(trackData.checkpoints) || trackData.checkpoints.length < 2) {
      throw new Error('[CheckpointSystem] 无效的赛道数据：至少需要 2 个检查点');
    }

    this._track = trackData;
    this._cpSegments = trackData.checkpoints.map((_, i) => this._computeSegment(i));
    this._carStates.clear();
  }

  /**
   * 计算第 index 个检查点的线段（垂直于赛道方向的门）
   * @param {number} index
   * @returns {{ a: Vector2D, b: Vector2D, center: Vector2D }}
   */
  _computeSegment(index) {
    const cp = this._track.checkpoints[index];
    const cpCount = this._track.checkpoints.length;

    // 通过前后相邻点计算赛道切线方向
    const prev = this._track.checkpoints[(index - 1 + cpCount) % cpCount];
    const next = this._track.checkpoints[(index + 1) % cpCount];

    const dirX = next.x - prev.x;
    const dirY = next.y - prev.y;
    const len = Math.sqrt(dirX * dirX + dirY * dirY);

    if (len < 0.001) {
      // 退化情况：相邻点重合，直接返回点本身
      return { a: { x: cp.x, y: cp.y }, b: { x: cp.x, y: cp.y }, center: cp };
    }

    // 垂直于赛道方向的单位向量（逆时针旋转 90°）
    const perpX = -dirY / len;
    const perpY = dirX / len;

    // 门的半宽（足够覆盖赛道宽度）
    const halfWidth = 40;

    return {
      a: { x: cp.x - perpX * halfWidth, y: cp.y - perpY * halfWidth },
      b: { x: cp.x + perpX * halfWidth, y: cp.y + perpY * halfWidth },
      center: { x: cp.x, y: cp.y },
    };
  }

  // ── 回调注册 ────────────────────────────────────────────

  /**
   * 注册"通过检查点"回调
   * @param {Function} callback - (carId, checkpointIndex, lap) => void
   */
  onCheckpointPassed(callback) {
    this._onCheckpointPassed = callback;
  }

  /**
   * 注册"完成一圈"回调
   * @param {Function} callback - (carId, lap) => void
   */
  onLapComplete(callback) {
    this._onLapComplete = callback;
  }

  /**
   * 注册"完成所有圈数"回调
   * @param {Function} callback - (carId) => void
   */
  onRaceComplete(callback) {
    this._onRaceComplete = callback;
  }

  // ── 赛车注册 ────────────────────────────────────────────

  /**
   * 注册一辆赛车到检查点追踪系统
   * @param {string} carId
   */
  registerCar(carId) {
    if (this._carStates.has(carId)) return;

    this._carStates.set(carId, {
      nextCheckpoint: 0,          // 下一个需要通过的检查点索引
      lap: 0,                     // 当前已完成圈数
      lastPosition: null,         // 上一帧位置（用于线段相交检测）
    });
  }

  /**
   * 移除一辆赛车
   * @param {string} carId
   */
  unregisterCar(carId) {
    this._carStates.delete(carId);
  }

  // ── 核心检测逻辑 ────────────────────────────────────────

  /**
   * 更新所有已注册赛车状态（检测检查点通过、圈数变化）
   *
   * @param {string} carId - 赛车 ID
   * @param {{ x: number, y: number }} position - 当前位置（世界坐标）
   * @param {{ x: number, y: number }} prevPosition - 上一帧位置
   * @returns {{
   *   checkpointPassed: boolean,
   *   checkpointIndex: number,
   *   lapCompleted: boolean,
   *   raceCompleted: boolean,
   * }}
   */
  update(carId, position, prevPosition) {
    const state = this._carStates.get(carId);
    if (!state) {
      return { checkpointPassed: false, checkpointIndex: -1, lapCompleted: false, raceCompleted: false };
    }

    // 首次更新时初始化上一帧位置
    if (!state.lastPosition) {
      state.lastPosition = { x: position.x, y: position.y };
      return { checkpointPassed: false, checkpointIndex: -1, lapCompleted: false, raceCompleted: false };
    }

    // 使用传入的 prevPosition 或记录的上次位置
    const from = prevPosition || state.lastPosition;

    const result = {
      checkpointPassed: false,
      checkpointIndex: -1,
      lapCompleted: false,
      raceCompleted: false,
    };

    // 检测是否穿过下一个需要通过的检查点
    const expectedIdx = state.nextCheckpoint;
    const segment = this._cpSegments[expectedIdx];
    const crossed = this._segmentsCross(from, position, segment.a, segment.b);

    if (crossed) {
      // ✅ 正确按顺序通过检查点
      state.nextCheckpoint = (expectedIdx + 1) % this._cpSegments.length;
      result.checkpointPassed = true;
      result.checkpointIndex = expectedIdx;

      // 触发通过检查点回调
      if (this._onCheckpointPassed) {
        this._onCheckpointPassed(carId, expectedIdx, state.lap);
      }

      // ⭕ 通过最后一个检查点 → 完成一圈
      if (state.nextCheckpoint === 0) {
        state.lap++;
        result.lapCompleted = true;

        if (this._onLapComplete) {
          this._onLapComplete(carId, state.lap);
        }

        // 🏁 所有圈数完成
        if (state.lap >= this._track.lapCount) {
          result.raceCompleted = true;
          if (this._onRaceComplete) {
            this._onRaceComplete(carId);
          }
        }
      }
    }

    // 记录当前位置作为下一帧的上一帧
    state.lastPosition = { x: position.x, y: position.y };
    return result;
  }

  // ── 线段相交检测 ──────────────────────────────────────

  /**
   * 判断两条线段是否相交
   * 使用方向法（orientation）进行精确检测
   *
   * @param {{ x:number, y:number }} p1 - 线段1端点
   * @param {{ x:number, y:number }} p2 - 线段1端点
   * @param {{ x:number, y:number }} q1 - 线段2端点
   * @param {{ x:number, y:number }} q2 - 线段2端点
   * @returns {boolean}
   */
  _segmentsCross(p1, p2, q1, q2) {
    const o1 = this._orientation(p1, p2, q1);
    const o2 = this._orientation(p1, p2, q2);
    const o3 = this._orientation(q1, q2, p1);
    const o4 = this._orientation(q1, q2, p2);

    // 一般相交：端点分别在对方线段两侧
    if (o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0) {
      if (o1 !== o2 && o3 !== o4) return true;
    }

    // 特殊共线情况：端点落在另一线段上
    if (o1 === 0 && this._onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && this._onSegment(p1, p2, q2)) return true;
    if (o3 === 0 && this._onSegment(q1, q2, p1)) return true;
    if (o4 === 0 && this._onSegment(q1, q2, p2)) return true;

    return false;
  }

  /**
   * 计算三点方向（叉积）
   * (q - p) × (r - p)
   *
   * @returns {number} 0=共线, 1=顺时针, 2=逆时针
   */
  _orientation(p, q, r) {
    const val = (q.y - p.y) * (r.x - p.x) - (q.x - p.x) * (r.y - p.y);
    if (Math.abs(val) < 1e-10) return 0;
    return val > 0 ? 1 : 2;
  }

  /**
   * 检查点 r 是否在线段 p-q 上（含端点）
   */
  _onSegment(p, q, r) {
    return (
      r.x <= Math.max(p.x, q.x) + 1e-10 &&
      r.x >= Math.min(p.x, q.x) - 1e-10 &&
      r.y <= Math.max(p.y, q.y) + 1e-10 &&
      r.y >= Math.min(p.y, q.y) - 1e-10
    );
  }

  // ── 查询方法 ──────────────────────────────────────────

  /**
   * 获取赛车当前圈数
   * @param {string} carId
   * @returns {number}
   */
  getLap(carId) {
    const state = this._carStates.get(carId);
    return state ? state.lap : 0;
  }

  /**
   * 获取赛车下一个需要通过的检查点索引
   * @param {string} carId
   * @returns {number}
   */
  getNextCheckpoint(carId) {
    const state = this._carStates.get(carId);
    return state ? state.nextCheckpoint : 0;
  }

  /**
   * 获取赛车已完成圈数的进度（0~1）
   * @param {string} carId
   * @returns {number}
   */
  getProgress(carId) {
    const state = this._carStates.get(carId);
    if (!state || !this._track) return 0;
    const totalCheckpoints = this._cpSegments.length;
    const progressInLap = state.nextCheckpoint / totalCheckpoints;
    const totalLaps = this._track.lapCount;
    return (state.lap + progressInLap) / totalLaps;
  }

  /**
   * 检查赛车是否已完成所有圈数
   * @param {string} carId
   * @returns {boolean}
   */
  isRaceComplete(carId) {
    const state = this._carStates.get(carId);
    return state ? state.lap >= this._track.lapCount : false;
  }

  // ── 生命周期 ──────────────────────────────────────────

  /**
   * 重置所有赛车状态
   */
  reset() {
    for (const [carId] of this._carStates) {
      this._carStates.set(carId, {
        nextCheckpoint: 0,
        lap: 0,
        lastPosition: null,
      });
    }
  }

  /**
   * 释放资源
   */
  destroy() {
    this._carStates.clear();
    this._cpSegments = [];
    this._track = null;
    this._onCheckpointPassed = null;
    this._onLapComplete = null;
    this._onRaceComplete = null;
  }
}
