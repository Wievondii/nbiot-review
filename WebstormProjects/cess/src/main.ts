/**
 * 游戏主入口
 * 初始化游戏引擎并启动游戏
 */
import { GameEngine } from './engine/GameEngine';

/** 全局游戏引擎实例（供其他模块访问） */
let gameEngine: GameEngine | null = null;

/** 获取游戏引擎实例 */
export function getGameEngine(): GameEngine | null {
  return gameEngine;
}

/** 启动游戏 */
async function main(): Promise<void> {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

  if (!canvas) {
    console.error('[Main] 找不到游戏画布元素');
    return;
  }

  // 创建并初始化游戏引擎
  gameEngine = new GameEngine();

  try {
    await gameEngine.init(canvas);
    console.log('[Main] 游戏启动成功');
  } catch (error) {
    console.error('[Main] 游戏启动失败:', error);
  }
}

// 页面加载完成后启动游戏
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
