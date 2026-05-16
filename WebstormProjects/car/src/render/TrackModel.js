/**
 * @file 3D 赛道模型
 *
 * 根据 TrackData（2D 赛道数据）构建 3D 赛道网格。
 * 将 2D 赛道数据映射到 Three.js 的 XZ 平面（Y 轴向上）。
 *
 * 映射规则：2D {x, y} → 3D {x, 0, z}（z = y）
 *
 * 构建内容：
 *   1. 路面（利用 Shape + Hole 生成内外壁之间的路面网格）
 *   2. 外壁护栏（沿外壁多边形生成垂直墙段）
 *   3. 内壁护栏（沿内壁多边形生成垂直墙段）
 *   4. 起点/终点线（横跨路面的白色条纹标记）
 *   5. 检查点标记（在每个检查点位置的小型彩色柱）
 *
 * @module render/TrackModel
 */

import * as THREE from 'three';

// ============================================================
// 材质颜色常量
// ============================================================

/** 路面颜色（深沥青色） */
const ROAD_COLOR = 0x333340;

/** 路面边线颜色（白色） */
const ROAD_EDGE_COLOR = 0xffffff;

/** 护栏主色（红色） */
const BARRIER_COLOR = 0xcc3333;

/** 护栏配色（白色条纹） */
const BARRIER_ACCENT_COLOR = 0xeeeeee;

/** 起点/终点线颜色 */
const START_LINE_COLOR = 0xffffff;

/** 检查点柱颜色（青色） */
const CHECKPOINT_COLOR = 0x00ccff;

/** 起点指示柱颜色（绿色） */
const START_POINT_COLOR = 0x00ff88;

// ============================================================
// 尺寸常量
// ============================================================

/** 护栏高度（米） */
const BARRIER_HEIGHT = 1.2;

/** 护栏厚度（米） */
const BARRIER_THICKNESS = 0.2;

/** 路面略高出地面的厚度（米） */
const ROAD_THICKNESS = 0.15;

/** 起点线宽度（米） */
const START_LINE_WIDTH = 0.4;

/** 检查点柱高度（米） */
const CHECKPOINT_PILLAR_HEIGHT = 1.5;

/** 检查点柱半径（米） */
const CHECKPOINT_PILLAR_RADIUS = 0.15;

/** 起点柱高度 */
const START_PILLAR_HEIGHT = 2.0;

/** 起点柱半径 */
const START_PILLAR_RADIUS = 0.2;

export class TrackModel {
  constructor() {
    /** @type {THREE.Group} 赛道所有网格的根对象 */
    this.group = new THREE.Group();
    this.group.name = 'track';

    /** @type {Object[]} 创建的网格引用（用于后续清理） */
    this._meshes = [];

    /** @type {THREE.Mesh|null} 路面网格 */
    this._roadMesh = null;

    /** @type {THREE.Mesh[]} 护栏网格 */
    this._barrierMeshes = [];

    /** @type {THREE.Mesh[]} 检查点标记 */
    this._checkpointMeshes = [];
  }

  /**
   * 根据赛道数据构建 3D 赛道
   *
   * 自动检测赛道数据格式：
   * - 2D 格式：barriers 为 `[{ points: Vector2D[] }, { points: Vector2D[] }]`
   * - 3D 格式：barriers 为 `[{ position, size, rotation }, ...]`
   *
   * @param {Object} trackData - 赛道数据（兼容 2D 和 3D 格式）
   * @returns {THREE.Group} 包含所有赛道元素的 Three.js Group
   */
  build(trackData) {
    // 清除已有内容
    this._clear();

    if (!trackData) {
      console.warn('[TrackModel] 赛道数据为空，跳过构建');
      return this.group;
    }

    const barriers = trackData.barriers;
    if (!barriers || barriers.length === 0) {
      console.warn('[TrackModel] 赛道数据缺少边界，跳过构建');
      return this.group;
    }

    // 检测赛道数据格式：3D (position/size/rotation) 或 2D (points)
    const is3DFormat = barriers[0].position !== undefined;

    if (is3DFormat) {
      return this._build3D(trackData);
    }

    // 2D 格式：约定 barriers[0] = 外壁，barriers[1] = 内壁
    const outerPoints = barriers[0].points;
    const innerPoints = barriers[1].points;

    if (!outerPoints || outerPoints.length < 3 || !innerPoints || innerPoints.length < 3) {
      console.warn('[TrackModel] 赛道边界点不足，跳过构建');
      return this.group;
    }

    // 1. 创建路面
    this._createRoadSurface(outerPoints, innerPoints);

    // 2. 创建外壁护栏
    this._createBarrierWall(outerPoints, false);

    // 3. 创建内壁护栏
    this._createBarrierWall(innerPoints, true);

    // 4. 创建起点/终点线
    this._createStartFinishLine(trackData);

    // 5. 创建检查点标记
    this._createCheckpointMarkers(trackData.checkpoints);

    // 6. 创建起点指示柱
    this._createStartPillar(trackData.startPoint);

    if (window.DEBUG) {
      console.log(`[TrackModel] 赛道 "${trackData.name}" 3D 构建完成`);
    }

    return this.group;
  }

  /**
   * 使用 3D 格式构建赛道
   *
   * barriers 为 Barrier3D[]：{ position: {x,y,z}, size: {x,y,z}, rotation: number }
   * 将每个 barrier 渲染为 3D 盒体，并创建简易地面。
   *
   * @private
   * @param {Object} trackData - 3D 赛道数据
   * @returns {THREE.Group}
   */
  _build3D(trackData) {
    const barriers = trackData.barriers;

    // 1. 创建简易地面
    this._createGround();

    // 2. 创建 3D 障碍物盒体
    for (let i = 0; i < barriers.length; i++) {
      this._createBarrierBox(barriers[i], i);
    }

    // 3. 创建检查点标记
    this._createCheckpointMarkers(trackData.checkpoints);

    // 4. 创建起点指示柱
    this._createStartPillar(trackData.startPoint);

    if (window.DEBUG) {
      console.log(`[TrackModel] 赛道 "${trackData.name}" 3D 构建完成（3D barriers）`);
    }

    return this.group;
  }

  /**
   * 创建简易地面
   * @private
   */
  _createGround() {
    const groundMat = new THREE.MeshPhongMaterial({
      color: 0x333340,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    ground.name = 'ground';
    this.group.add(ground);
    this._meshes.push(ground);
  }

  /**
   * 创建单个 3D 障碍物盒体
   * @private
   * @param {Object} barrier - { position, size, rotation }
   * @param {number} index
   */
  _createBarrierBox(barrier, index) {
    const pos = barrier.position || { x: 0, y: 0, z: 0 };
    const size = barrier.size || { x: 1, y: 1, z: 1 };
    const angle = barrier.rotation ?? 0;

    const barrierMat = new THREE.MeshPhongMaterial({
      color: BARRIER_COLOR,
      roughness: 0.6,
      metalness: 0.3,
    });

    const geo = new THREE.BoxGeometry(size.x * 2, size.y * 2, size.z * 2);
    const mesh = new THREE.Mesh(geo, barrierMat);
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.rotation.y = -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `barrier3d_${index}`;
    this.group.add(mesh);
    this._barrierMeshes.push(mesh);
    this._meshes.push(mesh);
  }

  // ----------------------------------------------------------
  // 路面
  // ----------------------------------------------------------

  /**
   * 创建路面表面（介于内外壁之间的区域）
   *
   * 利用 Three.js ShapeGeometry 生成内/外壁之间的多边形网格，
   * 然后将几何体从 XY 平面平铺到 XZ 平面（Y→Z 重映射）。
   *
   * @private
   * @param {Array<{x:number, y:number}>} outerPts - 外壁多边形顶点
   * @param {Array<{x:number, y:number}>} innerPts - 内壁多边形顶点
   */
  _createRoadSurface(outerPts, innerPts) {
    const shape = new THREE.Shape();
    // 外壁轮廓
    shape.moveTo(outerPts[0].x, outerPts[0].y);
    for (let i = 1; i < outerPts.length; i++) {
      shape.lineTo(outerPts[i].x, outerPts[i].y);
    }
    shape.closePath();

    // 内壁轮廓（作为孔洞）
    const hole = new THREE.Path();
    hole.moveTo(innerPts[0].x, innerPts[0].y);
    for (let i = 1; i < innerPts.length; i++) {
      hole.lineTo(innerPts[i].x, innerPts[i].y);
    }
    hole.closePath();
    shape.holes.push(hole);

    // 生成二维几何体（在 XY 平面）
    const shapeGeo = new THREE.ShapeGeometry(shape);

    // 重映射：Y → Z，Y 设为 0（路面在 XZ 平面上）
    const pos = shapeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      pos.setZ(i, y);
      pos.setY(i, 0);
    }
    pos.needsUpdate = true;
    shapeGeo.computeVertexNormals();

    // 路面材质（深色沥青，微粗糙表面）
    const roadMat = new THREE.MeshPhongMaterial({
      color: ROAD_COLOR,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    this._roadMesh = new THREE.Mesh(shapeGeo, roadMat);
    this._roadMesh.position.y = -0.05; // 略低于地面
    this._roadMesh.receiveShadow = true;
    this._roadMesh.name = 'roadSurface';
    this.group.add(this._roadMesh);
    this._meshes.push(this._roadMesh);

    // 路面底部（增加厚度视觉感）
    const roadMatBottom = new THREE.MeshPhongMaterial({
      color: 0x222228,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    const roadBottom = new THREE.Mesh(shapeGeo.clone(), roadMatBottom);
    roadBottom.position.y = -ROAD_THICKNESS - 0.05;
    roadBottom.name = 'roadBottom';
    this.group.add(roadBottom);
    this._meshes.push(roadBottom);
  }

  // ----------------------------------------------------------
  // 护栏
  // ----------------------------------------------------------

  /**
   * 创建护栏墙（沿多边形边的垂直墙段）
   *
   * 每个墙段使用细长的 BoxGeometry，定位在边的中点上，
   * 旋转对齐边的方向。
   *
   * @private
   * @param {Array<{x:number, y:number}>} points - 多边形顶点数组
   * @param {boolean} isInner - 是否为内壁（内壁护栏材质略浅）
   */
  _createBarrierWall(points, isInner) {
    const n = points.length;
    const barrierMat = new THREE.MeshPhongMaterial({
      color: isInner ? 0xbb4444 : BARRIER_COLOR,
      roughness: 0.6,
      metalness: 0.3,
    });

    const accentMat = new THREE.MeshPhongMaterial({
      color: BARRIER_ACCENT_COLOR,
      roughness: 0.5,
      metalness: 0.1,
    });

    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];

      // 计算边的中点和方向（2D 坐标）
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segLength = Math.sqrt(dx * dx + dy * dy);

      if (segLength < 0.01) continue;

      // 边的朝向角度（弧度，绕 Y 轴）
      const angle = Math.atan2(dy, dx);

      // 创建墙段（长条箱体）
      const wallGeo = new THREE.BoxGeometry(segLength, BARRIER_HEIGHT, BARRIER_THICKNESS);
      const wall = new THREE.Mesh(wallGeo, barrierMat);
      // 2D → 3D 映射：{midX, midY} → {midX, 0, midY}
      wall.position.set(midX, BARRIER_HEIGHT / 2, midY);
      wall.rotation.y = -angle; // Three.js 旋转方向与 atan2 相反
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.name = `barrier_${isInner ? 'inner' : 'outer'}_${i}`;
      this.group.add(wall);
      this._barrierMeshes.push(wall);
      this._meshes.push(wall);

      // 交替添加白色条纹（每两个段一个条纹）
      if (i % 2 === 0) {
        const stripeGeo = new THREE.BoxGeometry(segLength * 0.6, BARRIER_HEIGHT * 0.3, BARRIER_THICKNESS * 1.1);
        const stripe = new THREE.Mesh(stripeGeo, accentMat);
        stripe.position.set(midX, BARRIER_HEIGHT * 0.7, midY);
        stripe.rotation.y = -angle;
        stripe.name = `barrierStripe_${i}`;
        this.group.add(stripe);
        this._meshes.push(stripe);
      }
    }
  }

  // ----------------------------------------------------------
  // 起点/终点线
  // ----------------------------------------------------------

  /**
   * 创建横跨路面的起点/终点线标记
   *
   * 在起点位置生成垂直于车道方向的棋盘格条纹。
   *
   * @private
   * @param {Object} trackData - 赛道数据
   */
  _createStartFinishLine(trackData) {
    const sp = trackData.startPoint;
    const angle = trackData.startAngle;

    // 起点线方向（垂直于车道方向）
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);

    // 道路宽度估算（内外壁之间的距离）
    const outerPts = trackData.barriers[0].points;
    const innerPts = trackData.barriers[1].points;
    const roadWidth = this._estimateRoadWidth(outerPts, innerPts, sp);

    // 起点线：横跨道路的白色条纹
    const lineLength = roadWidth * 0.9;

    // 格子条纹（多个小方块组成棋盘格效果）
    const tileCount = 8;
    const tileSize = lineLength / tileCount;

    for (let i = 0; i < tileCount; i++) {
      // 交替黑白
      const isWhite = i % 2 === 0;
      const tileMat = new THREE.MeshPhongMaterial({
        color: isWhite ? 0xffffff : 0x222222,
        roughness: 0.5,
        metalness: 0.0,
      });

      const tileGeo = new THREE.PlaneGeometry(tileSize * 0.9, START_LINE_WIDTH * 0.9);
      const tile = new THREE.Mesh(tileGeo, tileMat);

      // 计算偏移：从道路中心沿垂直方向排列
      const offset = (i - tileCount / 2 + 0.5) * tileSize;
      const posX = sp.x + perpX * offset;
      const posZ = sp.y + perpY * offset;

      // 平铺在地面上方
      const tileZ = startPoint.z !== undefined ? posZ : posZ; // posZ already uses sp.y
      tile.position.set(posX, 0.02, posZ);
      tile.rotation.x = -Math.PI / 2;
      tile.rotation.z = -angle;
      tile.name = `startLineTile_${i}`;
      this.group.add(tile);
      this._meshes.push(tile);
    }
  }

  // ----------------------------------------------------------
  // 检查点标记
  // ----------------------------------------------------------

  /**
   * 在每个检查点位置创建彩色柱标记
   *
   * @private
   * @param {Array<{x:number, y:number}>} checkpoints - 检查点坐标数组
   */
  _createCheckpointMarkers(checkpoints) {
    if (!checkpoints || checkpoints.length === 0) return;

    const pillarMat = new THREE.MeshPhongMaterial({
      color: CHECKPOINT_COLOR,
      emissive: CHECKPOINT_COLOR,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.6,
    });

    for (let i = 0; i < checkpoints.length; i++) {
      const cp = checkpoints[i];

      // 检查点柱（细长圆柱）
      const pillarGeo = new THREE.CylinderGeometry(
        CHECKPOINT_PILLAR_RADIUS,
        CHECKPOINT_PILLAR_RADIUS * 1.2,
        CHECKPOINT_PILLAR_HEIGHT,
        8
      );
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      // 兼容 2D ({x,y}) 和 3D ({x,y,z}) 格式
      const cpZ = cp.z !== undefined ? cp.z : cp.y;
      pillar.position.set(cp.x, CHECKPOINT_PILLAR_HEIGHT / 2, cpZ);
      pillar.castShadow = true;
      pillar.name = `checkpointPillar_${i}`;
      this.group.add(pillar);
      this._checkpointMeshes.push(pillar);
      this._meshes.push(pillar);

      // 检查点序号标签底座（小圆盘）
      const labelMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0x4488ff,
        emissiveIntensity: 0.1,
        roughness: 0.4,
        metalness: 0.3,
        side: THREE.DoubleSide,
      });
      const labelGeo = new THREE.CircleGeometry(0.12, 8);
      const label = new THREE.Mesh(labelGeo, labelMat);
      const labelZ = cp.z !== undefined ? cp.z : cp.y;
      label.position.set(cp.x, CHECKPOINT_PILLAR_HEIGHT + 0.02, labelZ);
      label.rotation.x = -Math.PI / 2;
      label.name = `checkpointLabel_${i}`;
      this.group.add(label);
      this._meshes.push(label);
    }
  }

  /**
   * 创建起点指示柱（绿色发光柱）
   * @private
   * @param {{x:number, y:number}} startPoint - 起点坐标
   */
  _createStartPillar(startPoint) {
    if (!startPoint) return;

    const pillarMat = new THREE.MeshPhongMaterial({
      color: START_POINT_COLOR,
      emissive: START_POINT_COLOR,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.5,
    });

    const pillarGeo = new THREE.CylinderGeometry(
      START_PILLAR_RADIUS,
      START_PILLAR_RADIUS * 1.3,
      START_PILLAR_HEIGHT,
      8
    );
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    const startZ = startPoint.z !== undefined ? startPoint.z : startPoint.y;
    pillar.position.set(startPoint.x, START_PILLAR_HEIGHT / 2, startZ);
    pillar.castShadow = true;
    pillar.name = 'startPillar';
    this.group.add(pillar);
    this._meshes.push(pillar);
  }

  // ----------------------------------------------------------
  // 工具方法
  // ----------------------------------------------------------

  /**
   * 估算起点处的道路宽度
   *
   * 找到起点附近的内外壁点，计算它们之间的距离。
   *
   * @private
   * @param {Array} outerPts
   * @param {Array} innerPts
   * @param {{x:number, y:number}} startPoint
   * @returns {number} 道路宽度（米）
   */
  _estimateRoadWidth(outerPts, innerPts, startPoint) {
    if (!outerPts || !innerPts || !startPoint) return 30;

    // 找到距离起点最近的外壁点和内壁点
    let minOuterDist = Infinity;
    let outerIdx = 0;
    for (let i = 0; i < outerPts.length; i++) {
      const dx = outerPts[i].x - startPoint.x;
      const dy = outerPts[i].y - startPoint.y;
      const d = dx * dx + dy * dy;
      if (d < minOuterDist) {
        minOuterDist = d;
        outerIdx = i;
      }
    }

    let minInnerDist = Infinity;
    let innerIdx = 0;
    for (let i = 0; i < innerPts.length; i++) {
      const dx = innerPts[i].x - startPoint.x;
      const dy = innerPts[i].y - startPoint.y;
      const d = dx * dx + dy * dy;
      if (d < minInnerDist) {
        minInnerDist = d;
        innerIdx = i;
      }
    }

    // 计算内外壁点之间的距离
    const ox = outerPts[outerIdx].x;
    const oy = outerPts[outerIdx].y;
    const ix = innerPts[innerIdx].x;
    const iy = innerPts[innerIdx].y;
    const dist = Math.sqrt((ox - ix) ** 2 + (oy - iy) ** 2);

    return Math.max(dist, 15);
  }

  /**
   * 获取赛道根对象
   * @returns {THREE.Group}
   */
  getObject() {
    return this.group;
  }

  // ----------------------------------------------------------
  // 清理
  // ----------------------------------------------------------

  /**
   * 清除所有赛道网格
   * @private
   */
  _clear() {
    for (const mesh of this._meshes) {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => { m.dispose(); });
        } else {
          mesh.material.dispose();
        }
      }
    }
    this._meshes = [];
    this._barrierMeshes = [];
    this._checkpointMeshes = [];
    this._roadMesh = null;

    // 清除 group 中所有子元素
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
  }

  /**
   * 释放赛道模型占用的 GPU 资源
   */
  dispose() {
    this._clear();
  }
}
