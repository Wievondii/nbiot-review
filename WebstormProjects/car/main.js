/**
 * @file 主入口 - 模块组装与游戏启动
 *
 * 严格按照以下顺序初始化所有模块:
 *   AudioManager → TrackLoader → PhysicsEngine → RenderEngine → InputMapper → UIManager → GameLoop
 *
 * 集成验证要点:
 *   1. 所有模块构造正确，无缺失依赖
 *   2. 初始化顺序符合规范
 *   3. GameLoop.init() 中注册的回调在 setState 之前完成
 *   4. 调用链路完整：对照接口调用关系表确认
 */

// ============================================================
// Core 模块
// ============================================================
import { EventBus, GameState, GameLoop } from './src/core/index.js';

// ============================================================
// 各功能模块（导入名称与实际 export 匹配）
// ============================================================
import { AudioManager } from './src/audio/index.js';
import { TrackLoader, CheckpointSystem } from './src/track/index.js';
import { PhysicsEngine } from './src/physics/index.js';
import { RenderEngine } from './src/render/index.js';
import { InputMapper } from './src/input/index.js';
import { UIManager } from './src/ui/index.js';

// ============================================================
// 调试模式：通过 ?debug=1 URL 参数开启详细日志
// ============================================================
(function initDebugMode() {
  const DEBUG = new URLSearchParams(window.location.search).has('debug');
  if (DEBUG) {
    window.DEBUG = true;
    console.log('[Main] 调试模式已开启');
  }
})();

// ============================================================
// 错误显示函数（显示到 #error 元素）
// ============================================================
function showError(message) {
  const errorEl = document.getElementById('error');
  if (errorEl) {
    errorEl.innerHTML = message;
    errorEl.style.display = 'flex';
  } else {
    // 兜底：如果 #error 元素不存在，创建临时提示
    const fallback = document.createElement('div');
    fallback.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;display:flex;' +
      'align-items:center;justify-content:center;background:#0a0a0a;' +
      'color:#ff4444;font-size:1.2rem;z-index:999;padding:20px;text-align:center;';
    fallback.textContent = message.replace(/<br>/g, '\n');
    document.body.appendChild(fallback);
  }
  // 隐藏 loading（如果有）
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
  }
}

// ============================================================
// 浏览器兼容性检查
// ============================================================
function checkBrowserSupport() {
  const errors = [];

  // 检查 Canvas 2D
  const testCanvas = document.createElement('canvas');
  const testCtx = testCanvas.getContext('2d');
  if (!testCtx) {
    errors.push('您的浏览器不支持 Canvas 2D，请使用 Chrome/Firefox/Edge 等现代浏览器');
  }

  // 检查 Web Audio API
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) {
    errors.push('您的浏览器不支持 Web Audio API，请使用 Chrome/Firefox/Edge 等现代浏览器');
  }

  if (window.DEBUG) {
    if (errors.length === 0) {
      console.log('[Main] 浏览器兼容性检查通过 ✅');
    } else {
      console.warn('[Main] 兼容性问题:', errors);
    }
  }

  return errors;
}

// ============================================================
// 全局错误捕获
// ============================================================
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error || event.message);
  showError('发生错误：' + (event.error ? event.error.message : event.message));
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason);
  const reason = event.reason;
  const msg = reason ? reason.message || String(reason) : '未知错误';
  showError('Promise 错误：' + msg);
});

// ============================================================
// 游戏启动入口
// ============================================================
async function main() {
  const loading = document.getElementById('loading');
  const canvas = document.getElementById('gameCanvas');
  const container = canvas.parentElement;

  if (window.DEBUG) console.time('[Main] 启动耗时');

  // 浏览器兼容性检查（在模块初始化之前执行）
  const compatibilityErrors = checkBrowserSupport();
  if (compatibilityErrors.length > 0) {
    showError(compatibilityErrors.join('<br>'));
    return;
  }

  // 设置加载超时保护：10秒后如果游戏未启动，显示错误信息
  let gameStarted = false;
  const loadingTimeout = setTimeout(() => {
    if (!gameStarted) {
      const msg = '游戏加载超时，请检查网络连接后刷新页面重试。';
      console.error('[Main] ' + msg);
      showError(msg);
    }
  }, 10000);

  // 1. 创建核心基础设施
  const eventBus = new EventBus();
  const gameState = new GameState(eventBus);
  if (window.DEBUG) console.log('[Main] 核心基础设施创建完成');

  // ---- 初始化顺序: AudioManager → TrackLoader → CheckpointSystem → PhysicsEngine → RenderEngine → InputMapper → UIManager → GameLoop ----

  // 2. 初始化音效系统（第1位）
  const audioManager = new AudioManager();
  audioManager.init(); // 同步调用，AudioManager.init() 返回 this 而非 Promise
  if (window.DEBUG) console.log('[Main] AudioManager 初始化完成');

  // 3. 初始化赛道系统（第2位）
  const trackLoader = new TrackLoader();
  // 加载默认赛道 'motor-speedway'（在菜单状态真正进入时会重新加载所选赛道）
  // 注意：Menu.js 中赛道名与实际注册名可能不同，GameLoop 中有映射逻辑
  trackLoader.loadTrack('motor-speedway');
  if (window.DEBUG) console.log('[Main] TrackLoader 初始化完成');

  // 4. 初始化检查点系统（第3位）
  //    需在 init() 中传入赛道数据（在 GameLoop 进入菜单退出时完成）
  const checkpointSystem = new CheckpointSystem();

  // 5. 初始化物理引擎（第4位）
  //    需在 init() 中传入赛车配置和赛道边界（在 GameLoop 进入菜单退出时完成）
  const physicsEngine = new PhysicsEngine();

  // 6. 初始化渲染引擎（第5位）- 需要 Canvas 元素
  const renderEngine = new RenderEngine();
  renderEngine.init(canvas);
  if (window.DEBUG) console.log('[Main] RenderEngine 初始化完成');

  // 7. 初始化输入控制器（第6位）- 纯键盘/触摸，不需要外部依赖
  const inputMapper = new InputMapper();
  inputMapper.init(container);
  if (window.DEBUG) console.log('[Main] InputMapper 初始化完成');

  // 8. 初始化 UI 系统（第7位）- 需要 Canvas 容器和事件总线
  const uiManager = new UIManager(canvas, eventBus);
  if (window.DEBUG) console.log('[Main] UIManager 初始化完成');

  // 9. 组装游戏主循环（第8位，最后一位，依赖所有其他模块）
  const gameLoop = new GameLoop({
    physicsEngine,
    renderEngine,
    inputController: inputMapper,
    audioManager,
    trackManager: trackLoader,
    uiManager,
    eventBus,
    gameState,
    checkpointSystem,
  });

  // 9. 初始化游戏循环（内部会注册回调并设置初始状态）
  gameLoop.init();
  if (window.DEBUG) console.log('[Main] GameLoop 初始化完成');

  // 10. 先启动游戏循环，再隐藏加载提示（确保游戏循环真正运行）
  gameLoop.start();
  gameStarted = true;
  clearTimeout(loadingTimeout);
  loading.classList.add('hidden');

  if (window.DEBUG) {
    console.timeEnd('[Main] 启动耗时');
    console.log('[Main] 游戏启动完成 ✅');
  }
}

// 启动游戏
main().catch((err) => {
  console.error('[Main] 游戏启动失败:', err);
  showError('游戏加载失败：' + (err.message || err));
});
