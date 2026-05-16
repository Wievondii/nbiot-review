/**
 * @file 精灵绘制函数
 *
 * 提供赛车、赛道等游戏对象的绘制方法。
 * 所有绘制函数使用世界坐标，调用前需已应用摄像机变换。
 */

/**
 * 绘制赛车（简化为带轮廓的矩形）
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../types.js').CarEntity} car - 赛车状态
 * @param {string} [color] - 车身颜色
 */
export function drawCar(ctx, car, color = '#00f0ff') {
  const halfW = 0.9;   // 半宽（米）
  const halfL = 2.0;   // 半长（米）

  ctx.save();
  ctx.translate(car.position.x, car.position.y);
  ctx.rotate(car.angle);

  // 车身
  ctx.fillStyle = car.isDrifting ? '#ff00e4' : color;
  ctx.fillRect(-halfL, -halfW, halfL * 2, halfW * 2);

  // 边框
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.08;
  ctx.strokeRect(-halfL, -halfW, halfL * 2, halfW * 2);

  // 车头标记（前进方向的小三角）
  ctx.beginPath();
  ctx.moveTo(halfL + 0.3, 0);
  ctx.lineTo(halfL - 0.3, -halfW * 0.6);
  ctx.lineTo(halfL - 0.3, halfW * 0.6);
  ctx.closePath();
  ctx.fillStyle = '#ffffff88';
  ctx.fill();

  // 漂移时绘制拖尾光效
  if (car.isDrifting) {
    ctx.fillStyle = '#ff00e444';
    ctx.beginPath();
    ctx.arc(-halfL - 0.5, 0, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 绘制赛道边界
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../types.js').Barrier[]} barriers - 边界多边形数组
 */
export function drawBarriers(ctx, barriers) {
  if (!barriers || barriers.length === 0) return;

  for (const barrier of barriers) {
    if (!barrier.points || barrier.points.length < 3) continue;

    ctx.beginPath();
    ctx.moveTo(barrier.points[0].x, barrier.points[0].y);
    for (let i = 1; i < barrier.points.length; i++) {
      ctx.lineTo(barrier.points[i].x, barrier.points[i].y);
    }
    ctx.closePath();

    // 填充
    ctx.fillStyle = 'rgba(80, 80, 100, 0.3)';
    ctx.fill();

    // 描边（霓虹风格）
    ctx.strokeStyle = '#00f0ff88';
    ctx.lineWidth = 0.3;
    ctx.stroke();

    // 发光效果
    ctx.strokeStyle = '#00f0ff22';
    ctx.lineWidth = 1.0;
    ctx.stroke();
  }
}

/**
 * 绘制检查点标记（调试用）
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../types.js').Vector2D[]} checkpoints
 */
export function drawCheckpoints(ctx, checkpoints) {
  if (!checkpoints) return;

  for (const cp of checkpoints) {
    ctx.beginPath();
    ctx.arc(cp.x, cp.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd70044';
    ctx.fill();
    ctx.strokeStyle = '#ffd70088';
    ctx.lineWidth = 0.2;
    ctx.stroke();
  }
}

/**
 * 绘制起点标记
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../types.js').Vector2D} startPoint
 * @param {number} startAngle
 */
export function drawStartPoint(ctx, startPoint, startAngle) {
  if (!startPoint) return;

  ctx.save();
  ctx.translate(startPoint.x, startPoint.y);
  ctx.rotate(startAngle);

  // 方向箭头
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.lineTo(1, -1.5);
  ctx.moveTo(3, 0);
  ctx.lineTo(1, 1.5);
  ctx.strokeStyle = '#00ff8866';
  ctx.lineWidth = 0.3;
  ctx.stroke();

  ctx.restore();
}
