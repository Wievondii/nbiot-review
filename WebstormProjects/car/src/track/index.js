/**
 * 赛道系统模块
 * @module track
 *
 * 提供赛道数据定义、赛道加载、检查点检测等功能。
 *
 * 使用示例：
 * ```js
 * import { TrackLoader, CheckpointSystem, DEFAULT_TRACK, validateTrackData } from './track/index.js';
 *
 * const loader = new TrackLoader();
 * const track = loader.loadTrack('motor-speedway');
 *
 * const checkpointSystem = new CheckpointSystem();
 * checkpointSystem.init(track);
 * checkpointSystem.registerCar('player');
 *
 * // 每帧更新
 * checkpointSystem.update('player', car.position, car.prevPosition);
 * ```
 */

export { TrackLoader } from './TrackLoader.js';
export { CheckpointSystem } from './Checkpoint.js';
export { DEFAULT_TRACK, TRACKS, validateTrackData } from './TrackData.js';
