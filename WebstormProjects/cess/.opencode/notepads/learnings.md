# 学习成果

## 成功模式

### 2026-05-10 Dev-2 僵尸系统开发

**学习内容：**
- 使用Three.js基础几何体（BoxGeometry）组合创建人形僵尸模型
- 通过rotation属性实现简单的行走动画（腿部摆动）
- 僵尸AI状态机：IDLE -> WALKING -> ATTACKING -> DEAD
- 使用distanceTo计算距离判断攻击范围

**应用场景：**
- 游戏开发中的NPC实体设计
- 3D模型的程序化生成
- 简单AI行为树实现

**注意事项：**
- Three.js的LSP类型声明需要npm install后才能识别
- 使用clone()方法避免Vector3引用问题
- 攻击动画使用setTimeout实现简单时间控制

### 2026-05-10 Dev-2 波次管理系统

**学习内容：**
- 波次配置参数化：初始数量、递增量、难度系数
- 使用工厂模式批量生成僵尸
- 波次完成检测：统计存活僵尸数量

**应用场景：**
- 游戏关卡设计
- 难度曲线控制
- 对象池管理

**注意事项：**
- 生成位置需要围绕玩家周围，避免僵尸卡在墙里
- 波次间需要等待时间，让玩家有准备时间
- 僵尸数量不能太多，需要考虑性能

### 2026-05-10 Dev-2 输入管理系统

**学习内容：**
- 使用Pointer Lock API实现FPS视角控制
- movementX/Y获取鼠标移动增量
- Map存储按键状态，支持多键同时按下

**应用场景：**
- FPS游戏输入控制
- 浏览器游戏开发
- 用户交互设计

**注意事项：**
- requestPointerLock需要用户交互才能触发
- 需要阻止默认行为（如空格键滚动页面）
- 鼠标灵敏度需要可调，适应不同用户

### 2026-05-10 Dev-3 UI/HUD系统开发

**学习内容：**
- 使用HTML/CSS覆盖层实现游戏UI，而非Three.js内置UI
- CSS变量实现主题一致性，方便后续修改
- 半透明磨砂效果使用backdrop-filter: blur()
- 金属质感边框通过渐变和阴影实现

**应用场景：**
- Web游戏UI设计
- 暗黑恐怖风格视觉设计
- 响应式游戏界面

**注意事项：**
- pointer-events: none用于UI容器，避免阻挡游戏交互
- CSS动画使用@keyframes实现连杀提示等动态效果
- 响应式设计使用@media查询适应不同屏幕尺寸

### 2026-05-10 Dev-3 音频系统开发

**学习内容：**
- Web Audio API实现音效播放和音量控制
- AudioBufferSourceNode用于播放音效，支持复用
- GainNode实现音量控制，支持多级音量（主音量、音效、音乐）
- 音频上下文需要用户交互后才能创建（Chrome自动暂停策略）

**应用场景：**
- 浏览器游戏音效系统
- 背景音乐播放
- 音效预加载和缓存

**注意事项：**
- AudioContext需要用户交互后才能创建
- 音效文件需要预加载，避免播放时延迟
- 使用try-catch处理音频解码错误

### 2026-05-10 Dev-3 得分系统开发

**学习内容：**
- 连杀系统设计：计时器 + 倍率计算
- 波次奖励递增公式：base * multiplier^(wave-1)
- localStorage存储高分记录
- 事件驱动架构：通过CustomEvent通知UI更新

**应用场景：**
- 游戏得分系统设计
- 本地数据持久化
- 组件间通信

**注意事项：**
- localStorage可能被禁用，需要try-catch处理
- 连杀计时器需要每帧更新，使用Date.now()比较
- 得分计算需要考虑整数溢出（虽然JavaScript不会溢出）

## 遇到的问题

### 2026-05-10 TypeScript类型声明问题

**现象：**
- LSP报错"Cannot find module 'three'"
- 类型定义文件中使用declare namespace无法导出

**原因：**
- npm install后TypeScript服务器需要重新索引
- declare namespace创建的是全局类型，不是模块导出

**解决方案：**
- 使用import * as THREE from 'three'引入真实类型
- 确保package.json中包含@types/three

## 验证结果
- 待测试员验证

### 2026-05-10 Dev-1 核心引擎开发

**学习内容：**
- Three.js + cannon-es 集成：物理体与3D模型位置同步
- 第一人称视角控制：Pointer Lock API + 鼠标移动增量
- 物理碰撞检测：使用CANNON.Cylinder近似胶囊体
- 射线检测系统：从相机方向发射射线判定命中

**应用场景：**
- FPS游戏核心引擎开发
- 3D物理模拟
- 浏览器游戏性能优化

**注意事项：**
- cannon-es的Body没有userData属性，需要使用Map跟踪僵尸物理体
- 碰撞事件类型需要自定义接口，cannon-es没有导出ICollisionEvent
- 物理步进需要限制deltaTime防止物理模拟不稳定
- 使用linearDamping防止玩家滑行，fixedRotation防止玩家旋转

### 2026-05-10 Dev-3 审查问题修复

**学习内容：**
- Vite资源导入方式：使用 `import './styles.css'` 替代动态创建 `<link>` 标签
- 依赖倒置原则：依赖接口（IAudioManager）而非具体类（AudioManager）
- 生命值UI设计：三级颜色警告系统（红/橙/暗红）提供更好的视觉反馈
- 动态配置获取：从游戏实例获取配置而非硬编码

**应用场景：**
- Vite项目中的静态资源管理
- SOLID原则在游戏开发中的应用
- 游戏UI/UX设计最佳实践
- 避免硬编码的配置管理

**注意事项：**
- Vite生产构建会重新打包资源路径，硬编码路径会失效
- 依赖接口便于单元测试mock和模块替换
- UI颜色设计需要考虑不同状态的视觉区分度
- 使用 `??` 运算符提供默认值，避免空引用错误

### 2026-05-10 Dev-2 审查问题修复

**学习内容：**
- 游戏实体必须有物理碰撞体：Three.js mesh + cannon-es body 双重绑定
- 物理体移动优于直接修改position：使用applyForce或velocity
- 工厂模式需要传递所有依赖：physicsWorld必须传递给每个僵尸
- 帧驱动优于setTimeout：动画计时器应该在update()中递减

**应用场景：**
- 物理引擎集成：创建物理体、设置碰撞分组、同步位置
- 工厂模式设计：传递依赖注入
- 游戏循环中的动画控制
- 代码审查和bug修复流程

**注意事项：**
- cannon-es的碰撞分组：group=2表示僵尸，mask=1|4表示与玩家和障碍物碰撞
- 物理体位置需要调整到脚底：body.position.y - height/2
- dispose()必须移除物理体，否则内存泄漏
- 使用userData存储临时状态（如原始颜色）

