/**
 * 碰撞检测系统
 *
 * 基于分离轴定理（SAT）的多边形碰撞检测。
 * 支持赛车 vs 赛道边界（多边形） 和 赛车 vs 赛车（OBB vs OBB）。
 *
 * 效率优化：使用空间网格（SpatialGrid）对赛道边界进行空间分割，
 * 只检测赛车周围格子内的边界，避免全量遍历。
 *
 * @module Collision
 */

import { DRIFT_PARAMS } from './Drift.js';

// ============================================================
// 向量工具函数
// ============================================================

/** 向量点积 */
export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

/** 向量叉积（标量，z分量） */
export function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

/** 向量长度 */
export function length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/** 向量归一化，返回新向量 */
export function normalize(v) {
  const len = length(v);
  if (len < 1e-10) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/** 向量相减 */
export function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

/** 获取边的法线（指向外侧） */
function edgeNormal(a, b) {
  const edge = subtract(b, a);
  // 法线 = 垂直边向量，指向外侧（对凸包有效）
  return normalize({ x: -edge.y, y: edge.x });
}

// ============================================================
// 空间网格（Spatial Grid）
// ============================================================

/**
 * 空间网格，将赛道边界按位置分桶
 * 只检测相邻格子内的对象，减少碰撞检测次数
 */
export class SpatialGrid {
  /**
   * @param {number} cellSize - 每个格子的尺寸（米）
   */
  constructor(cellSize = 20) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  /** 清空所有格子 */
  clear() {
    this.cells.clear();
  }

  /**
   * 计算格子键值
   * @param {number} x
   * @param {number} y
   * @returns {string}
   */
  _key(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  /**
   * 将一条赛道边界（barrier）插入网格
   * 根据所有顶点占据的格子进行插入
   * @param {Object} barrier - { points: Vector2D[] }
   */
  insertBarrier(barrier) {
    // 用所有顶点的包围盒决定覆盖哪些格子
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const p of barrier.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    const minCx = Math.floor(minX / this.cellSize);
    const minCy = Math.floor(minY / this.cellSize);
    const maxCx = Math.floor(maxX / this.cellSize);
    const maxCy = Math.floor(maxY / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = `${cx},${cy}`;
        if (!this.cells.has(key)) {
          this.cells.set(key, []);
        }
        this.cells.get(key).push(barrier);
      }
    }
  }

  /**
   * 获取位置周围 3x3 格子内的所有赛道边界
   * @param {number} x
   * @param {number} y
   * @returns {Object[]} barrier 数组
   */
  getNearbyBarriers(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const seen = new Set();
    const results = [];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cx + dx},${cy + dy}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const barrier of cell) {
            // 用 barrier 对象引用去重
            if (!seen.has(barrier)) {
              seen.add(barrier);
              results.push(barrier);
            }
          }
        }
      }
    }

    return results;
  }
}

// ============================================================
// 赛车 OBB 顶点计算
// ============================================================

/**
 * 获取赛车 OBB（有向包围盒）的四个顶点
 *
 * 赛车是一个矩形，由中心位置、朝向角度和尺寸决定。
 * 坐标系：Y轴向上，X轴向右，角度逆时针为正。
 *
 *    v3 ---- v2
 *     |      |
 *    v0 ---- v1
 *
 * @param {Object} car - 赛车内部状态
 * @returns {Vector2D[]} 四个顶点（逆时针顺序）
 */
export function getCarVertices(car) {
  const cos = Math.cos(car.angle);
  const sin = Math.sin(car.angle);

  // 面向方向（forward = 车头指向）和垂直方向（perpendicular = 车身侧面）
  // 坐标系：Y轴向上，X轴向右，角度逆时针为正
  const facing = { x: cos, y: sin };
  const perp = { x: -sin, y: cos };

  const hw = car.halfWidth;
  const hl = car.halfLength;

  // 四个顶点（逆时针）：
  //   back-left  ←  back-right
  //       ↓            ↓
  //   front-left → front-right
  return [
    {
      x: car.position.x - facing.x * hl - perp.x * hw,
      y: car.position.y - facing.y * hl - perp.y * hw,
    },
    {
      x: car.position.x - facing.x * hl + perp.x * hw,
      y: car.position.y - facing.y * hl + perp.y * hw,
    },
    {
      x: car.position.x + facing.x * hl + perp.x * hw,
      y: car.position.y + facing.y * hl + perp.y * hw,
    },
    {
      x: car.position.x + facing.x * hl - perp.x * hw,
      y: car.position.y + facing.y * hl - perp.y * hw,
    },
  ];
}

// ============================================================
// 分离轴定理（SAT）碰撞检测
// ============================================================

/**
 * 将多边形投影到指定轴上
 * @param {Vector2D[]} vertices - 多边形顶点数组
 * @param {Vector2D} axis - 投影轴（已归一化）
 * @returns {{ min: number, max: number }} 投影区间
 */
function projectPolygon(vertices, axis) {
  let min = dot(vertices[0], axis);
  let max = min;

  for (let i = 1; i < vertices.length; i++) {
    const p = dot(vertices[i], axis);
    if (p < min) min = p;
    if (p > max) max = p;
  }

  return { min, max };
}

/**
 * 获取多边形的所有边法线（作为候选分离轴）
 * @param {Vector2D[]} vertices - 多边形顶点数组（逆时针顺序）
 * @returns {Vector2D[]} 法线数组（已归一化）
 */
function getAxes(vertices) {
  const axes = [];
  const count = vertices.length;

  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    const edge = subtract(vertices[j], vertices[i]);
    // 边的法线（垂直方向）
    const normal = normalize({ x: -edge.y, y: edge.x });
    axes.push(normal);
  }

  return axes;
}

/**
 * 检查两个多边形是否碰撞（SAT）
 *
 * @param {Vector2D[]} verticesA - 多边形 A 的顶点
 * @param {Vector2D[]} verticesB - 多边形 B 的顶点
 * @returns {null | { overlap: number, normal: Vector2D, contactPoint: Vector2D }}
 *   - null: 未碰撞
 *   - overlap: 穿透深度
 *   - normal: 碰撞法线（指向 A 应被推开的方向）
 *   - contactPoint: 碰撞点（近似取A的中心）
 */
export function satCollision(verticesA, verticesB) {
  // 收集两个多边形的所有边法线
  const axes = [...getAxes(verticesA), ...getAxes(verticesB)];

  let minOverlap = Infinity;
  let minAxis = null;

  for (const axis of axes) {
    // 跳过零向量（极罕见情况）
    if (length(axis) < 1e-10) continue;

    const projA = projectPolygon(verticesA, axis);
    const projB = projectPolygon(verticesB, axis);

    const overlap = Math.min(projA.max - projB.min, projB.max - projA.min);

    // 如果任何一个轴没有重叠，则无碰撞
    if (projA.max < projB.min || projB.max < projA.min) {
      return null;
    }

    if (overlap < minOverlap) {
      minOverlap = overlap;
      minAxis = axis;
    }
  }

  // 确保法线方向从 B 指向 A
  const centerA = getCentroid(verticesA);
  const centerB = getCentroid(verticesB);
  const dir = subtract(centerA, centerB);

  if (dot(minAxis, dir) < 0) {
    minAxis = { x: -minAxis.x, y: -minAxis.y };
  }

  return {
    overlap: minOverlap,
    normal: minAxis,
    contactPoint: { ...centerA },
  };
}

/**
 * 计算多边形中心
 * @param {Vector2D[]} vertices
 * @returns {Vector2D}
 */
function getCentroid(vertices) {
  let cx = 0, cy = 0;
  for (const v of vertices) {
    cx += v.x;
    cy += v.y;
  }
  return { x: cx / vertices.length, y: cy / vertices.length };
}

// ============================================================
// 导出函数
// ============================================================

/**
 * 检测一辆赛车与所有赛道边界的碰撞
 *
 * 使用空间网格优化：只检查赛车周围格子内的边界。
 *
 * @param {Object} car - 赛车内部状态
 * @param {Object[]} barriers - 赛道边界数组 [{ points: Vector2D[] }]
 * @param {SpatialGrid} [grid] - 空间网格（可选，如不提供则遍历所有边界）
 * @returns {CollisionEvent[]}
 */
export function checkCarBarrierCollisions(car, barriers, grid) {
  const events = [];
  const carVertices = getCarVertices(car);

  // 确定需要检测的边界
  let candidates = barriers;
  if (grid) {
    candidates = grid.getNearbyBarriers(car.position.x, car.position.y);
  }

  for (const barrier of candidates) {
    const barrierVertices = barrier.points;
    if (barrierVertices.length < 3) continue; // 不是多边形

    const result = satCollision(carVertices, barrierVertices);
    if (result) {
      // 计算冲击力 = 速度在法线方向的分量 × 质量
      const velAlongNormal = Math.abs(
        dot(car.velocity, result.normal)
      );
      const impactForce = velAlongNormal * car.mass;

      events.push({
        carId: car.id,
        barrier,
        otherCarId: undefined,
        impactForce,
        collision: result,
      });
    }
  }

  return events;
}

/**
 * 检测两辆赛车之间的碰撞
 *
 * @param {Object} carA - 赛车 A 内部状态
 * @param {Object} carB - 赛车 B 内部状态
 * @returns {CollisionEvent | null}
 */
export function checkCarCarCollisions(carA, carB) {
  const verticesA = getCarVertices(carA);
  const verticesB = getCarVertices(carB);

  const result = satCollision(verticesA, verticesB);
  if (!result) return null;

  // 相对速度
  const relVel = {
    x: carA.velocity.x - carB.velocity.x,
    y: carA.velocity.y - carB.velocity.y,
  };
  const velAlongNormal = Math.abs(dot(relVel, result.normal));
  const impactForce = velAlongNormal * Math.min(carA.mass, carB.mass);

  return {
    carId: carA.id,
    barrier: undefined,
    otherCarId: carB.id,
    impactForce,
    collision: result,
  };
}

/**
 * 处理碰撞响应
 *
 * 1. 沿法线方向分离车辆（修正穿透）
 * 2. 沿法线方向施加冲量（减速反弹）
 * 3. 衰减角速度（碰撞后旋转减少）
 *
 * @param {Object} car - 赛车内部状态（会被修改）
 * @param {Object} collision - SAT 碰撞结果 { overlap, normal }
 * @param {number} [massScale=1.0] - 质量缩放（车 vs 车时为相对质量比）
 */
export function resolveCollision(car, collision, massScale = 1.0) {
  const { overlap, normal } = collision;

  // 1. 位置修正：沿法线推出
  car.position.x += normal.x * overlap;
  car.position.y += normal.y * overlap;

  // 2. 速度修正
  const velAlongNormal = dot(car.velocity, normal);

  // 如果速度朝向法线方向（即正往障碍物里钻）
  if (velAlongNormal < 0) {
    // 反弹：速度沿法线方向被反弹并衰减
    const impulse = -velAlongNormal * (1 + DRIFT_PARAMS.COLLISION_BOUNCE) * massScale;
    car.velocity.x += normal.x * impulse;
    car.velocity.y += normal.y * impulse;

    // 同时减少切向速度（模拟摩擦）
    const tangent = { x: -normal.y, y: normal.x };
    const velAlongTangent = dot(car.velocity, tangent);
    car.velocity.x -= tangent.x * velAlongTangent * 0.3;
    car.velocity.y -= tangent.y * velAlongTangent * 0.3;
  }

  // 3. 角速度衰减（碰撞会让车旋转减弱）
  car.angularVelocity *= DRIFT_PARAMS.COLLISION_SPIN_DAMP;
}

/**
 * 构建赛道边界的空间网格
 * @param {Object[]} barriers
 * @param {number} cellSize
 * @returns {SpatialGrid}
 */
export function buildBarrierGrid(barriers, cellSize = 20) {
  const grid = new SpatialGrid(cellSize);
  for (const barrier of barriers) {
    grid.insertBarrier(barrier);
  }
  return grid;
}
