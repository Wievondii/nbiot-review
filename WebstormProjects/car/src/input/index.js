/**
 * 输入控制模块入口
 *
 * 导出 InputMapper（InputController 实现）以及底层输入源，
 * 方便上层按需独立使用键盘/触摸输入。
 *
 * @module input
 */

export { KeyboardInput, KEY_ACTIONS } from './Keyboard.js';
export { TouchInput } from './Touch.js';
export { InputMapper } from './InputMapper.js';
