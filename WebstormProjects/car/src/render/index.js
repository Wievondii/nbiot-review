/**
 * @file 3D 渲染引擎模块 - 统一导出
 *
 * 导出所有 3D 渲染相关模块：
 * - RenderEngine3D：Three.js 渲染引擎
 * - SceneBuilder：场景构建（天空盒、地面、环境）
 * - Lighting：光照系统（环境光、方向光、半球光）
 *
 * @module render
 *
 * 注意：CarModel、CameraController、TrackModel 由 Dev-4 提供，
 * 集成时需要在下方追加对应导出语句。
 */

export { RenderEngine3D } from './RenderEngine3D.js';
export { SceneBuilder } from './SceneBuilder.js';
export { Lighting } from './Lighting.js';

// Dev-4 模块导出（由集成负责人统一管理）
export { CameraController as CameraController3D } from './CameraController.js';
export { CarModel } from './CarModel.js';
export { TrackModel } from './TrackModel.js';
