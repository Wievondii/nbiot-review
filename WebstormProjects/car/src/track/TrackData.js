/**
 * 赛道数据定义
 * @module track/TrackData
 *
 * 接口遵循 TrackData 规范：
 *   { name, checkpoints: Vector2D[], barriers: Barrier[], startPoint: Vector2D, startAngle, lapCount }
 *   Barrier = { points: Vector2D[] }
 */

/**
 * 默认椭圆形赛道——"Motor Speedway"
 * 逆时针方向行驶，赛道宽度约 30m，总长约 550m
 */
export const DEFAULT_TRACK = {
  name: 'Motor Speedway',
  checkpoints: [
    { x: 100, y: 0 },      // 0: 起点/终点（右侧）
    { x: 70, y: 55 },      // 1: 右上
    { x: 0, y: 75 },       // 2: 顶部
    { x: -70, y: 55 },     // 3: 左上
    { x: -100, y: 0 },     // 4: 左侧
    { x: -70, y: -55 },    // 5: 左下
    { x: 0, y: -75 },      // 6: 底部
    { x: 70, y: -55 },     // 7: 右下
  ],
  barriers: [
    {
      // 外壁（20 个顶点，近似椭圆）
      points: [
        { x: 120, y: 0 },
        { x: 115, y: 30 },
        { x: 100, y: 55 },
        { x: 80, y: 70 },
        { x: 50, y: 80 },
        { x: 0, y: 85 },
        { x: -50, y: 80 },
        { x: -80, y: 70 },
        { x: -100, y: 55 },
        { x: -115, y: 30 },
        { x: -120, y: 0 },
        { x: -115, y: -30 },
        { x: -100, y: -55 },
        { x: -80, y: -70 },
        { x: -50, y: -80 },
        { x: 0, y: -85 },
        { x: 50, y: -80 },
        { x: 80, y: -70 },
        { x: 100, y: -55 },
        { x: 115, y: -30 },
      ],
    },
    {
      // 内壁（16 个顶点）
      points: [
        { x: 80, y: 0 },
        { x: 75, y: 20 },
        { x: 65, y: 35 },
        { x: 45, y: 45 },
        { x: 0, y: 50 },
        { x: -45, y: 45 },
        { x: -65, y: 35 },
        { x: -75, y: 20 },
        { x: -80, y: 0 },
        { x: -75, y: -20 },
        { x: -65, y: -35 },
        { x: -45, y: -45 },
        { x: 0, y: -50 },
        { x: 45, y: -45 },
        { x: 65, y: -35 },
        { x: 75, y: -20 },
      ],
    },
  ],
  startPoint: { x: 100, y: 0 },
  // 起点朝向：指向下一个检查点 (70, 55) 的方向
  startAngle: Math.atan2(55, -30),
  lapCount: 3,
};

/**
 * 预设赛道集合
 * @type {Map<string, object>}
 */
export const TRACKS = new Map([
  ['motor-speedway', DEFAULT_TRACK],
]);

/**
 * 验证赛道数据完整性
 * @param {*} data - 待验证的数据
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTrackData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['赛道数据必须是一个对象'] };
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push('缺少 name 字段或类型不正确');
  }

  if (!Array.isArray(data.checkpoints) || data.checkpoints.length < 2) {
    errors.push('checkpoints 必须是数组且至少包含 2 个点');
  } else {
    data.checkpoints.forEach((cp, i) => {
      if (typeof cp.x !== 'number' || typeof cp.y !== 'number') {
        errors.push(`checkpoints[${i}] 缺少有效的 x/y 坐标`);
      }
    });
  }

  if (!Array.isArray(data.barriers) || data.barriers.length === 0) {
    errors.push('barriers 必须是数组且不能为空');
  } else {
    data.barriers.forEach((barrier, i) => {
      if (!Array.isArray(barrier.points) || barrier.points.length < 3) {
        errors.push(`barriers[${i}].points 缺失或顶点数少于 3`);
      } else {
        barrier.points.forEach((pt, j) => {
          if (typeof pt.x !== 'number' || typeof pt.y !== 'number') {
            errors.push(`barriers[${i}].points[${j}] 缺少有效的 x/y 坐标`);
          }
        });
      }
    });
  }

  if (!data.startPoint || typeof data.startPoint.x !== 'number' || typeof data.startPoint.y !== 'number') {
    errors.push('startPoint 必须包含有效的 x/y 坐标');
  }

  if (typeof data.startAngle !== 'number' || isNaN(data.startAngle)) {
    errors.push('startAngle 必须是有效的数字');
  }

  if (!Number.isInteger(data.lapCount) || data.lapCount < 1) {
    errors.push('lapCount 必须是大于 0 的整数');
  }

  return { valid: errors.length === 0, errors };
}
