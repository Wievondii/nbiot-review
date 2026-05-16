/**
 * 物理引擎模块导出
 *
 * 统一导出所有物理模块的公开接口。
 *
 * @module physics
 */

export { PhysicsEngine, FIXED_DT, MAX_ACCUMULATOR } from './PhysicsEngine.js';
export { DRIFT_PARAMS } from './Drift.js';
export {
  checkCarBarrierCollisions,
  checkCarCarCollisions,
  satCollision,
  getCarVertices,
  SpatialGrid,
  buildBarrierGrid,
} from './Collision.js';
