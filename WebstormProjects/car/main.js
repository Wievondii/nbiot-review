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
// 游戏启动入口
// ============================================================
async function main() {
  const loading = document.getElementById('loading');
  const canvas = document.getElementById('gameCanvas');
  const container = canvas.parentElement;

  // 1. 创建核心基础设施
  const eventBus = new EventBus();
  const gameState = new GameState(eventBus);

  // ---- 初始化顺序: AudioManager → TrackLoader → CheckpointSystem → PhysicsEngine → RenderEngine → InputMapper → UIManager → GameLoop ----

  // 2. 初始化音效系统（第1位）
  const audioManager = new AudioManager();
  await audioManager.init();

  // 3. 初始化赛道系统（第2位）
  const trackLoader = new TrackLoader();
  // 加载默认赛道 'motor-speedway'（在菜单状态真正进入时会重新加载所选赛道）
  // 注意：Menu.js 中赛道名与实际注册名可能不同，GameLoop 中有映射逻辑
  trackLoader.loadTrack('motor-speedway');

  // 4. 初始化检查点系统（第3位）
  //    需在 init() 中传入赛道数据（在 GameLoop 进入菜单退出时完成）
  const checkpointSystem = new CheckpointSystem();

  // 5. 初始化物理引擎（第4位）
  //    需在 init() 中传入赛车配置和赛道边界（在 GameLoop 进入菜单退出时完成）
  const physicsEngine = new PhysicsEngine();

  // 6. 初始化渲染引擎（第5位）- 需要 Canvas 元素
  const renderEngine = new RenderEngine();
  renderEngine.init(canvas);

  // 7. 初始化输入控制器（第6位）- 纯键盘/触摸，不需要外部依赖
  const inputMapper = new InputMapper();
  inputMapper.init(container);

  // 8. 初始化 UI 系统（第7位）- 需要 Canvas 容器和事件总线
  const uiManager = new UIManager(canvas, eventBus);

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

  // 10. 隐藏加载提示，启动游戏
  loading.classList.add('hidden');
  gameLoop.start();
}

// 启动游戏
main().catch((err) => {
  console.error('[Main] 游戏启动失败:', err);
  const loading = document.getElementById('loading');
  if (loading) {
    loading.textContent = '游戏加载失败，请刷新页面重试';
  }
});
