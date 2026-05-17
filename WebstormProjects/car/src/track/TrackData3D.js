/**
 * 3D 赛道数据定义
 * @module track/TrackData3D
 *
 * 接口遵循 TrackData3D 规范：
 *   { name, roadSegments, barriers, checkpoints, startPoint, startAngle, lapCount, skybox? }
 */

/**
 * 创建一个 Vector3D 对象
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {{ x: number, y: number, z: number }}
 */
export function vec3(x, y, z) {
  return { x, y, z };
}

// ── 默认 3D 赛道：Motor Speedway 3D ────────────────────

/**
 * 默认椭圆形 3D 赛道——"Motor Speedway 3D"
 *
 * 赛道位于 xz 平面（y=0），逆时针方向行驶，
 * 总长约 550m，宽度约 30m。
 */
export const DEFAULT_TRACK_3D = {
  name: 'Motor Speedway 3D',

  /**
   * 道路段序列
   * 每段定义中心位置、朝向、宽度、曲率和坡度
   */
  roadSegments: (function () {
    // 检查点位置（用作道路段的关键节点）
    const cp = [
      vec3(100, 0, 0),     // 0: 右侧（起点/终点）
      vec3(70, 0, 55),     // 1: 右上
      vec3(0, 0, 75),      // 2: 顶部
      vec3(-70, 0, 55),    // 3: 左上
      vec3(-100, 0, 0),    // 4: 左侧
      vec3(-70, 0, -55),   // 5: 左下
      vec3(0, 0, -75),     // 6: 底部
      vec3(70, 0, -55),    // 7: 右下
    ];

    const count = cp.length;
    const segments = [];

    for (let i = 0; i < count; i++) {
      const from = cp[i];
      const to = cp[(i + 1) % count];

      // 中点
      const midX = (from.x + to.x) / 2;
      const midZ = (from.z + to.z) / 2;

      // 朝向（指向下一个点）
      const dx = to.x - from.x;
      const dz = to.z - from.z;
      const rotation = Math.atan2(dx, dz);

      // 曲率：与前后段的方向变化量
      const prevFrom = cp[(i - 1 + count) % count];
      const prevDx = from.x - prevFrom.x;
      const prevDz = from.z - prevFrom.z;
      const prevAngle = Math.atan2(prevDx, prevDz);
      let angleDiff = rotation - prevAngle;
      // 归一化到 [-PI, PI]
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      segments.push({
        position: vec3(midX, 0, midZ),
        rotation: rotation,
        width: 30,
        curvature: Math.abs(angleDiff) * 2, // 方向变化越大曲率越大
        hill: 0,
      });
    }

    return segments;
  })(),

  /**
   * 3D 碰撞边界
   * 围绕椭圆形赛道内外两侧放置的箱体碰撞体
   */
  barriers: (function () {
    const result = [];

    // 检查点位置（8 个节点）
    const nodes = [
      vec3(100, 0, 0),
      vec3(70, 0, 55),
      vec3(0, 0, 75),
      vec3(-70, 0, 55),
      vec3(-100, 0, 0),
      vec3(-70, 0, -55),
      vec3(0, 0, -75),
      vec3(70, 0, -55),
    ];

    const count = nodes.length;
    const innerOffset = 12;  // 内侧偏移（略小于半宽）
    const outerOffset = 18;  // 外侧偏移（略大于半宽）

    for (let i = 0; i < count; i++) {
      const curr = nodes[i];
      const next = nodes[(i + 1) % count];

      // 该段的方向向量
      const dx = next.x - curr.x;
      const dz = next.z - curr.z;
      const len = Math.sqrt(dx * dx + dz * dz);
      if (len < 0.01) continue;

      // 单位方向
      const udx = dx / len;
      const udz = dz / len;

      // 外法线（顺时针旋转90°，指向椭圆外侧）
      // 从椭圆中心(0,0)到该段中点的方向作为"外侧"参考
      const midX = (curr.x + next.x) / 2;
      const midZ = (curr.z + next.z) / 2;
      const centerDist = Math.sqrt(midX * midX + midZ * midZ);
      if (centerDist < 0.01) continue;
      const outX = midX / centerDist;
      const outZ = midZ / centerDist;

      const segRotation = Math.atan2(udx, udz);

      /**
       * 放置一个屏障段
       * @param {number} ox  - 中心处的外法线偏移量（正=外侧，负=内侧）
       */
      const addBarrier = (ox) => {
        result.push({
          position: vec3(
            midX + outX * ox,
            2,                           // 高度中心（4m 高）
            midZ + outZ * ox
          ),
          // 箱体碰撞体大小
          size: vec3(len * 0.9, 4, 1.5),
          rotation: segRotation,
        });
      };

      // 外侧屏障
      addBarrier(outerOffset);
      // 内侧屏障
      addBarrier(-innerOffset);
    }

    return result;
  })(),

  /**
   * 检查点坐标序列（3D）
   * 每个检查点是一个垂直门（从 y=-20 到 y=20）
   */
  checkpoints: [
    vec3(100, 0, 0),
    vec3(70, 0, 55),
    vec3(0, 0, 75),
    vec3(-70, 0, 55),
    vec3(-100, 0, 0),
    vec3(-70, 0, -55),
    vec3(0, 0, -75),
    vec3(70, 0, -55),
  ],

  /** 起点位置 */
  startPoint: vec3(100, 0, 0),

  /**
   * 起点朝向（弧度）
   * 指向右侧赛道方向：从 (100,0,0) 朝向 (70,0,55)
   */
  startAngle: Math.atan2(70 - 100, 55 - 0),

  /** 比赛总圈数 */
  lapCount: 3,

  /** 天空盒（预留，后续可配置） */
  skybox: undefined,
};

/**
 * 预设 3D 赛道集合
 * @type {Map<string, object>}
 */
export const TRACKS_3D = new Map([
  ['motor-speedway-3d', DEFAULT_TRACK_3D],
]);

// ── 验证函数 ────────────────────────────────────────────

/**
 * 验证 3D 赛道数据完整性
 * @param {*} data - 待验证的数据
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTrackData3D(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['赛道数据必须是一个对象'] };
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push('缺少 name 字段或类型不正确');
  }

  // 验证 roadSegments
  if (!Array.isArray(data.roadSegments) || data.roadSegments.length < 2) {
    errors.push('roadSegments 必须是数组且至少包含 2 个段');
  } else {
    data.roadSegments.forEach((seg, i) => {
      if (!seg.position || typeof seg.position.x !== 'number' ||
          typeof seg.position.y !== 'number' || typeof seg.position.z !== 'number') {
        errors.push(`roadSegments[${i}] 缺少有效的 position (x/y/z)`);
      }
      if (typeof seg.rotation !== 'number') {
        errors.push(`roadSegments[${i}] 缺少 rotation`);
      }
      if (typeof seg.width !== 'number' || seg.width <= 0) {
        errors.push(`roadSegments[${i}] 缺少有效的 width`);
      }
      if (typeof seg.curvature !== 'number') {
        errors.push(`roadSegments[${i}] 缺少 curvature`);
      }
    });
  }

  // 验证 barriers
  if (Array.isArray(data.barriers)) {
    data.barriers.forEach((b, i) => {
      if (!b.position || typeof b.position.x !== 'number' ||
          typeof b.position.y !== 'number' || typeof b.position.z !== 'number') {
        errors.push(`barriers[${i}] 缺少有效的 position (x/y/z)`);
      }
      if (!b.size || typeof b.size.x !== 'number' ||
          typeof b.size.y !== 'number' || typeof b.size.z !== 'number') {
        errors.push(`barriers[${i}] 缺少有效的 size (x/y/z)`);
      }
      if (typeof b.rotation !== 'number') {
        errors.push(`barriers[${i}] 缺少 rotation`);
      }
    });
  }

  // 验证 checkpoints
  if (!Array.isArray(data.checkpoints) || data.checkpoints.length < 2) {
    errors.push('checkpoints 必须是数组且至少包含 2 个点');
  } else {
    data.checkpoints.forEach((cp, i) => {
      if (typeof cp.x !== 'number' || typeof cp.y !== 'number' || typeof cp.z !== 'number') {
        errors.push(`checkpoints[${i}] 缺少有效的 x/y/z 坐标`);
      }
    });
  }

  // 验证 startPoint
  if (!data.startPoint || typeof data.startPoint.x !== 'number' ||
      typeof data.startPoint.y !== 'number' || typeof data.startPoint.z !== 'number') {
    errors.push('startPoint 必须包含有效的 x/y/z 坐标');
  }

  if (typeof data.startAngle !== 'number' || isNaN(data.startAngle)) {
    errors.push('startAngle 必须是有效的数字');
  }

  if (!Number.isInteger(data.lapCount) || data.lapCount < 1) {
    errors.push('lapCount 必须是大于 0 的整数');
  }

  return { valid: errors.length === 0, errors };
}
