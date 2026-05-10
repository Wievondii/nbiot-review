# 问题记录

### 2026-05-10 Dev-1 GameEngine 未集成 Dev-2 模块 [第1轮审查]

**现象：**
- WaveManager、InputManager、GameStateMachine 被创建但从未被 GameEngine 使用
- GameEngine 自己管理波次、输入、状态，三个模块成为死代码

**原因：**
- Dev-1 和 Dev-2 并行开发，缺乏集成协调
- GameEngine 在设计时未考虑委托给独立模块

**解决方案：**
- GameEngine 应实例化 WaveManager、InputManager、GameStateMachine 并委托相关逻辑
- 移除 GameEngine 中重复的 wave/keys/gameState 管理

**责任 Developer：** Dev-1 + Dev-2 协作
**状态：** ✅ 已修复 (2026-05-10 17:00)

### 2026-05-10 Dev-2 波次难度递增配置未生效 [第1轮审查]

**现象：**
- `WaveManager.spawnZombies()` 创建了 `zombieConfig` 但从未应用到僵尸实例
- 所有僵尸始终使用默认属性（speed=2.0, health=100）

**原因：**
- `ZombieFactory.spawnZombiesInArea()` 不接受配置参数
- 代码中"应用难度配置"注释后只做了场景添加，未修改僵尸属性

**解决方案：**
- ZombieFactory 增加 config 参数传递
- spawnZombies 中遍历僵尸应用 speed/health 配置

**责任 Developer：** Dev-2

### 2026-05-10 Dev-1 射击命中僵尸无效 [第1轮审查]

**现象：**
- `GameEngine.onZombieHit()` 仅打印日志，不调用 `zombie.takeDamage()`
- 射击僵尸不会造成伤害，核心玩法不可用

**原因：**
- onZombieHit 是占位实现，未与僵尸实例建立关联
- GameEngine 不持有 WaveManager 引用无法查找僵尸

**解决方案：**
- 通过 WaveManager.damageZombie(zombieId, damage) 处理伤害
- GameEngine 集成 WaveManager 后在 shoot() 中正确调用

**责任 Developer：** Dev-1
**状态：** ✅ 已修复 (2026-05-10 17:00)

### 2026-05-10 Dev-2 僵尸无物理碰撞体 [第1轮审查]

**现象：**
- Zombie 类只有 Three.js 网格，没有 cannon-es 物理体
- 僵尸直接修改 position 移动，穿过墙壁和障碍物

**原因：**
- Zombie 实现时未集成物理引擎
- 仅通过 Three.js mesh 做可视化，无碰撞检测

**解决方案：**
- 为 Zombie 添加 cannon-es 物理体（球体或胶囊体）
- 通过 PhysicsWorld.addBody() 注册
- 移动通过物理力而非直接修改 position

**责任 Developer：** Dev-2

### 2026-05-10 Dev-3 CSS语法错误

**现象：**
- CSS文件中使用`-var(--spacing-md)`导致语法错误

**原因：**
- CSS不支持负号直接放在var()函数前面

**解决方案：**
- 使用`calc(-1 * var(--spacing-md))`代替`-var(--spacing-md)`

**状态：** 已修复

### 2026-05-10 Dev-1 武器切换内存浪费 [第1轮审查]

**现象：**
- 每次切换武器都创建新Weapon实例
- 旧武器实例未被销毁，存在内存浪费

**原因：**
- switchWeapon()方法直接new Weapon()创建新实例

**解决方案：**
- 预创建三把武器（手枪、霰弹枪、步枪）
- 切换时只切换引用，不创建新实例

**责任 Developer：** Dev-1
**状态：** ✅ 已修复 (2026-05-10 17:00)

### 2026-05-10 Dev-1 zombieBodyMap从未被填充，射击伤害链路断裂 [第1轮复审]

**现象：**
- `registerZombieBody(zombieId, body)` 方法已定义但从未被调用
- `zombieBodyMap` 始终为空，`shoot()` 中 `zombieBodyMap.get(result.body)` 始终返回 `undefined`
- 射线能命中僵尸物理体，但无法识别命中了哪个僵尸，`onZombieHit()` 永远不会执行

**原因：**
- Dev-1 定义了 `registerZombieBody()` API 但未在僵尸创建流程中集成调用
- Zombie 构造函数创建物理体后只注册到 PhysicsWorld，未注册到 GameEngine 的 zombieBodyMap
- WaveManager 和 ZombieFactory 不持有 GameEngine 引用，无法调用注册方法

**解决方案：**
- 在 WaveManager 中添加 `onZombieCreated` 回调函数
- 在 `spawnZombies()` 中创建僵尸后调用回调注册物理体
- 在 GameEngine 中设置回调函数调用 `registerZombieBody()`

**责任 Developer：** Dev-1
**状态：** ✅ 已修复 (2026-05-10 18:00)

