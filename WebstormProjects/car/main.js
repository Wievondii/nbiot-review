/**
 * @file 主入口 - 模块组装与游戏启动（3D 版本）
 *
 * 严格按照以下顺序初始化所有模块:
 *   AudioManager3D → TrackLoader → RenderEngine3D → CameraController → InputMapper → UIManager → GameLoop
 *
 * 初始化顺序（计划定义）:
 *   AudioManager3D.init() → RenderEngine3D.init() → PhysicsEngine3D.init() →
 *   TrackLoader3D.loadTrack() → CameraController.init() → InputMapper3D.init() →
 *   UIManager3D() → GameLoop(deps).init() → GameLoop.start()
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
// 各功能模块（3D 版本）
// ============================================================
import { AudioManager3D } from './src/audio/index.js';
import { TrackLoader3D, CheckpointSystem3D } from './src/track/index.js';
import { PhysicsEngine3D } from './src/physics/index.js';
import { RenderEngine3D } from './src/render/index.js';
import { CameraController3D, SceneBuilder } from './src/render/index.js';
import { InputMapper3D } from './src/input/index.js';
import { UIManager3D } from './src/ui/index.js';

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
  if (loading) loading.classList.add('hidden');
}

// ============================================================
// 浏览器兼容性检查
// ============================================================
function checkBrowserSupport() {
  const errors = [];

  // 检查 WebGL（Three.js 必需）
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      errors.push('您的浏览器不支持 WebGL，请使用 Chrome/Firefox/Edge 等现代浏览器');
    }
  } catch (e) {
    errors.push('WebGL 初始化失败，' + (e.message || ''));
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
  const container = document.getElementById('gameContainer');

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

  // ---- 初始化顺序: AudioManager3D → TrackLoader3D → RenderEngine3D → CameraController3D → InputMapper3D → UIManager3D → GameLoop ----

  // 2. 初始化音效系统（第1位）
  const audioManager = new AudioManager3D();
  audioManager.init();
  if (window.DEBUG) console.log('[Main] AudioManager3D 初始化完成');

  // 3. 初始化赛道系统（第2位）
  const trackLoader = new TrackLoader3D();
  // 加载默认赛道 'motor-speedway-3d'
  const track = trackLoader.loadTrack('motor-speedway-3d');
  if (!track) {
    showError('赛道数据加载失败，请刷新页面重试。');
    return;
  }
  if (window.DEBUG) console.log('[Main] TrackLoader3D 初始化完成');

  // 4. 初始化检查点系统（第3位）
  const checkpointSystem = new CheckpointSystem3D();

  // 5. 初始化物理引擎（第4位）
  const physicsEngine = new PhysicsEngine3D();
  physicsEngine.init();  // 创建 CANNON.World
  if (window.DEBUG) console.log('[Main] PhysicsEngine3D 初始化完成');

  // 6. 初始化渲染引擎（第5位）- 传入容器（不是 canvas，RenderEngine3D 会创建自己的 canvas）
  const renderEngine = new RenderEngine3D();
  renderEngine.init(container);

  // 6.5 创建 3D 场景和默认摄像机（供渲染引擎和摄像机控制器使用）
  const sceneBuilder = new SceneBuilder();
  const { scene, camera } = sceneBuilder.build();
  renderEngine.setScene(scene);
  renderEngine.setCamera(camera);

  // 6.6 根据容器实际尺寸调整 Canvas 分辨率，并监听窗口 resize 事件
  renderEngine.resize(container.clientWidth, container.clientHeight);
  window.addEventListener('resize', () => {
    renderEngine.resize(container.clientWidth, container.clientHeight);
    // 更新摄像机宽高比（如有透视摄像机）
    if (camera.aspect) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    }
  });
  if (window.DEBUG) console.log('[Main] 3D 场景和摄像机创建完成');

  // 7. 初始化摄像机控制器（第6位）
  const cameraController = new CameraController3D();
  // 实际 init(camera, target) 在 GameLoop 菜单退出时调用
  // 此时 renderEngine 已初始化，可通过 getCamera() 获取相机
  if (window.DEBUG) console.log('[Main] CameraController3D 创建完成');

  // 8. 初始化输入控制器（第7位）
  const inputMapper = new InputMapper3D();
  inputMapper.init(container);
  if (window.DEBUG) console.log('[Main] InputMapper3D 初始化完成');

  // 9. 初始化 UI 系统（第8位）
  const uiManager = new UIManager3D(canvas, eventBus);
  if (window.DEBUG) console.log('[Main] UIManager3D 初始化完成');

  // 10. 组装游戏主循环（第9位，依赖所有其他模块）
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
    cameraController,
  });

  // 11. 初始化游戏循环（内部会注册回调并设置初始状态）
  gameLoop.init();
  if (window.DEBUG) console.log('[Main] GameLoop 初始化完成');

  // 12. 先启动游戏循环，再隐藏加载提示
  gameLoop.start();
  gameStarted = true;
  clearTimeout(loadingTimeout);
  if (loading) loading.classList.add('hidden');

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
