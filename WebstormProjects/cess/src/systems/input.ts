/**
 * 输入管理系统
 * 实现IInputManager接口，处理键盘和鼠标输入
 */

import { IInputManager } from '../types';

/**
 * 输入管理器
 * 负责捕获和管理键盘、鼠标输入状态
 */
export class InputManager implements IInputManager {
  /** 按键状态映射 */
  private keyStates: Map<string, boolean> = new Map();

  /** 鼠标移动增量 */
  private mouseMovement: { x: number; y: number } = { x: 0, y: 0 };

  /** 指针锁定状态 */
  private pointerLocked: boolean = false;

  /** 鼠标灵敏度 */
  private mouseSensitivity: number = 0.002;

  /** 绑定的DOM元素 */
  private element: HTMLElement | null = null;

  /** 事件监听器引用（用于清理） */
  private eventListeners: Map<string, EventListener> = new Map();

  /**
   * 创建输入管理器
   * @param element 要绑定的DOM元素
   */
  constructor(element: HTMLElement) {
    this.element = element;
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.element) return;

    // 键盘按下
    const onKeyDown = (event: Event) => {
      const keyEvent = event as KeyboardEvent;
      this.keyStates.set(keyEvent.code, true);

      // 阻止默认行为（如空格键滚动页面）
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(keyEvent.code)) {
        keyEvent.preventDefault();
      }
    };

    // 键盘释放
    const onKeyUp = (event: Event) => {
      const keyEvent = event as KeyboardEvent;
      this.keyStates.set(keyEvent.code, false);
    };

    // 鼠标移动
    const onMouseMove = (event: Event) => {
      const mouseEvent = event as MouseEvent;

      if (this.pointerLocked) {
        // 使用movementX/Y获取鼠标移动增量
        this.mouseMovement.x += mouseEvent.movementX;
        this.mouseMovement.y += mouseEvent.movementY;
      }
    };

    // 鼠标按钮按下
    const onMouseDown = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      this.keyStates.set(`mouse${mouseEvent.button}`, true);
    };

    // 鼠标按钮释放
    const onMouseUp = (event: Event) => {
      const mouseEvent = event as MouseEvent;
      this.keyStates.set(`mouse${mouseEvent.button}`, false);
    };

    // 指针锁定变化
    const onPointerLockChange = () => {
      this.pointerLocked = document.pointerLockElement === this.element;
    };

    // 绑定事件
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // 保存引用用于清理
    this.eventListeners.set('keydown', onKeyDown);
    this.eventListeners.set('keyup', onKeyUp);
    this.eventListeners.set('mousemove', onMouseMove);
    this.eventListeners.set('mousedown', onMouseDown);
    this.eventListeners.set('mouseup', onMouseUp);
    this.eventListeners.set('pointerlockchange', onPointerLockChange);
  }

  /**
   * 锁定指针
   */
  public lockPointer(): void {
    if (this.element && !this.pointerLocked) {
      this.element.requestPointerLock();
    }
  }

  /**
   * 解锁指针
   */
  public unlockPointer(): void {
    if (this.pointerLocked) {
      document.exitPointerLock();
    }
  }

  /**
   * 检查指针是否锁定
   */
  public isPointerLocked(): boolean {
    return this.pointerLocked;
  }

  /**
   * 获取按键状态
   * @param key 按键代码（如'KeyW', 'Space', 'mouse0'）
   */
  public getKeyState(key: string): boolean {
    return this.keyStates.get(key) || false;
  }

  /**
   * 获取鼠标移动增量
   * 返回后自动重置
   */
  public getMouseMovement(): { x: number; y: number } {
    const movement = {
      x: this.mouseMovement.x * this.mouseSensitivity,
      y: this.mouseMovement.y * this.mouseSensitivity,
    };

    // 重置增量
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;

    return movement;
  }

  /**
   * 获取原始鼠标移动增量（不带灵敏度）
   */
  public getRawMouseMovement(): { x: number; y: number } {
    const movement = { ...this.mouseMovement };
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;
    return movement;
  }

  /**
   * 设置鼠标灵敏度
   * @param sensitivity 灵敏度值
   */
  public setMouseSensitivity(sensitivity: number): void {
    this.mouseSensitivity = Math.max(0.0001, Math.min(0.01, sensitivity));
  }

  /**
   * 获取鼠标灵敏度
   */
  public getMouseSensitivity(): number {
    return this.mouseSensitivity;
  }

  /**
   * 检查是否有任何移动输入
   * @returns 移动方向向量 {forward, backward, left, right}
   */
  public getMovementInput(): { forward: boolean; backward: boolean; left: boolean; right: boolean } {
    return {
      forward: this.getKeyState('KeyW') || this.getKeyState('ArrowUp'),
      backward: this.getKeyState('KeyS') || this.getKeyState('ArrowDown'),
      left: this.getKeyState('KeyA') || this.getKeyState('ArrowLeft'),
      right: this.getKeyState('KeyD') || this.getKeyState('ArrowRight'),
    };
  }

  /**
   * 检查跳跃输入
   */
  public isJumpPressed(): boolean {
    return this.getKeyState('Space');
  }

  /**
   * 检查射击输入
   */
  public isFirePressed(): boolean {
    return this.getKeyState('mouse0'); // 鼠标左键
  }

  /**
   * 检查换弹输入
   */
  public isReloadPressed(): boolean {
    return this.getKeyState('KeyR');
  }

  /**
   * 检查暂停输入
   */
  public isPausePressed(): boolean {
    return this.getKeyState('Escape');
  }

  /**
   * 更新输入状态（每帧调用）
   * 用于处理一些需要每帧重置的状态
   */
  public update(): void {
    // 可以在这里处理一些每帧需要重置的输入状态
  }

  /**
   * 清理事件监听器
   */
  public dispose(): void {
    this.eventListeners.forEach((listener, event) => {
      document.removeEventListener(event, listener);
    });
    this.eventListeners.clear();
    this.keyStates.clear();
  }
}
