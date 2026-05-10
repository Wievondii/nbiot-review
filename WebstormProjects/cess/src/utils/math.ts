/**
 * 数学工具函数
 */
import * as THREE from 'three';

/** 角度转弧度 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** 弧度转角度 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/** 限制值在范围内 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** 线性插值 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 计算两个三维点之间的距离 */
export function distance3D(a: THREE.Vector3, b: THREE.Vector3): number {
  return a.distanceTo(b);
}

/** 生成随机范围内的数 */
export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** 生成随机整数 */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}
