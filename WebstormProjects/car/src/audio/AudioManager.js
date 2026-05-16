/**
 * AudioManager - 核心音频管理器
 * ==============================
 * 使用 Web Audio API 生成所有游戏音效（合成音）。
 * 由于没有实际音频文件，所有声音通过 OscillatorNode
 * 和 AudioBuffer（噪声）实时合成。
 *
 * 接口实现：
 *  - init()
 *  - playEngine(speed)
 *  - playDrift()
 *  - playCollision()
 *  - playCountdown()
 *  - playLapComplete(lap)
 *  - playMusic(track)
 *  - setVolume(volume)
 *
 * @module AudioManager
 */

import { SoundPool } from './SoundPool.js';

// ============================================================
// 常量
// ============================================================

/** 引擎音最低频率（Hz） */
const ENGINE_FREQ_MIN = 60;
/** 引擎音最高频率（Hz） */
const ENGINE_FREQ_MAX = 200;
/** 速度最大值（m/s），用于归一化 */
const SPEED_MAX = 50;
/** 引擎最大音量 */
const ENGINE_VOL_MAX = 0.35;

/** 倒计时节拍定义：[时间偏移(秒), 频率(Hz), 持续(秒)] */
const COUNTDOWN_BEEPS = [
  { delay: 0, freq: 523, dur: 0.25 },  // 3 — C5
  { delay: 1, freq: 523, dur: 0.25 },  // 2 — C5
  { delay: 2, freq: 523, dur: 0.25 },  // 1 — C5
  { delay: 3, freq: 1047, dur: 0.5 },  // GO! — C6
];

/** 完成一圈的上升音阶 */
const LAP_NOTES = [523, 659, 784]; // C5, E5, G5

/** 声音池最大并发数 */
const POOL_MAX = 8;

// ============================================================
// 管理器类
// ============================================================

export class AudioManager {
  constructor() {
    /** @type {AudioContext|null} */
    this._ctx = null;

    /** @type {GainNode|null} 总音量控制 */
    this._masterGain = null;

    /** @type {number} 当前音量 [0, 1] */
    this._volume = 1.0;

    /** @type {boolean} 是否已初始化 */
    this._initialized = false;

    /** @type {SoundPool|null} */
    this._pool = null;

    // --- 引擎音相关 ---
    /** @type {OscillatorNode[]} */
    this._engineOscs = [];
    /** @type {GainNode|null} */
    this._engineGain = null;
    /** @type {boolean} */
    this._engineStarted = false;

    // --- 背景音乐相关 ---
    /** @type {OscillatorNode[]} */
    this._musicOscs = [];
    /** @type {GainNode|null} */
    this._musicGain = null;
    /** @type {boolean} */
    this._musicPlaying = false;

    // --- 漂移去重 ---
    /** @type {boolean} */
    this._driftPlaying = false;

    // --- 绑定方法（用于 setTimeout 回调确保 this 正确） ---
    this._playBeep = this._playBeep.bind(this);
  }

  // ============================================================
  // 公共接口
  // ============================================================

  /**
   * 初始化音频系统。
   * 创建 AudioContext、主音量 GainNode、声音池和引擎振荡器。
   * 如果浏览器不支持 Web Audio API，静默失败。
   *
   * @returns {AudioManager} this，便于链式调用
   */
  init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      console.warn('[AudioManager] 浏览器不支持 Web Audio API');
      return this;
    }

    try {
      this._ctx = new AC();

      // 主音量
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = this._volume;
      this._masterGain.connect(this._ctx.destination);

      // 声音池
      this._pool = new SoundPool(this._ctx, POOL_MAX);

      // 引擎振荡器
      this._setupEngine();

      this._initialized = true;
      console.log('[AudioManager] 初始化完成');
    } catch (e) {
      console.warn('[AudioManager] 初始化失败:', e.message);
    }

    return this;
  }

  /**
   * 更新引擎音效，频率和音量随速度变化。
   * 应在游戏循环的每帧调用（传入当前赛车速度）。
   *
   * @param {number} speed - 当前速率（米/秒），范围 0~50+
   */
  playEngine(speed) {
    if (!this._initialized) return;
    this._ensureContext();

    const norm = Math.max(0, Math.min(1, speed / SPEED_MAX));
    const freq = ENGINE_FREQ_MIN + norm * (ENGINE_FREQ_MAX - ENGINE_FREQ_MIN);
    const vol = norm * ENGINE_VOL_MAX;

    // 更新振荡器频率
    if (this._engineOscs.length >= 2) {
      this._engineOscs[0].frequency.setValueAtTime(freq, this._ctx.currentTime);
      this._engineOscs[1].frequency.setValueAtTime(freq * 1.5, this._ctx.currentTime);
    }

    // 平滑音量过渡
    if (this._engineGain) {
      this._engineGain.gain.setTargetAtTime(vol, this._ctx.currentTime, 0.1);
    }

    // 首次有速度时启动振荡器
    if (!this._engineStarted && speed > 0.5) {
      this._engineOscs.forEach((osc) => {
        try { osc.start(); } catch (_) { /* 可能已启动 */ }
      });
      this._engineStarted = true;
    }
  }

  /**
   * 播放漂移音效（过滤白噪声，短促爆发）。
   * 具有去重逻辑，同一时刻不会叠加播放。
   */
  playDrift() {
    if (!this._initialized || this._driftPlaying) return;
    this._ensureContext();

    this._driftPlaying = true;
    this._playNoise(0.3, 0.12, 1000, 4000, () => {
      this._driftPlaying = false;
    });
  }

  /**
   * 播放碰撞音效（低频冲击声）。
   */
  playCollision() {
    if (!this._initialized) return;
    this._ensureContext();

    this._playNoise(0.15, 0.35, 80, 600);
  }

  /**
   * 播放倒计时音效（3-2-1-GO）。
   * 每间隔 1 秒发出一个 beep，最后一个为高音长鸣。
   * 使用 setTimeout 实现时序。
   */
  playCountdown() {
    if (!this._initialized) return;
    this._ensureContext();

    COUNTDOWN_BEEPS.forEach((b) => {
      setTimeout(() => this._playBeep(b.freq, b.dur), b.delay * 1000);
    });
  }

  /**
   * 播放完成一圈的音效（C5→E5→G5 上行琶音）。
   *
   * @param {number} lap - 当前完成的圈数（仅用于信息，不改变音效）
   */
  playLapComplete(lap) {
    if (!this._initialized) return;
    this._ensureContext();

    LAP_NOTES.forEach((freq, i) => {
      setTimeout(() => this._playBeep(freq, 0.2), i * 150);
    });
  }

  /**
   * 播放背景音乐。
   * 由于无音频文件，使用低频振荡器生成环境音。
   * 每次调用会先停止当前正在播放的音乐，再启动新曲目。
   *
   * @param {string} track - 曲目名称 ('menu' | 'race')
   */
  playMusic(track) {
    if (!this._initialized) return;
    this._ensureContext();

    // 先停止当前音乐，防止振荡器泄漏
    this._stopMusic();

    if (track === 'menu') {
      this._startAmbient(220, 'sine', 0.05); // A3
    } else if (track === 'race') {
      this._startAmbient(110, 'triangle', 0.08); // A2
    }
  }

  /**
   * 停止背景音乐。
   * 停止并断开当前所有音乐振荡器和 GainNode，释放资源。
   */
  stopMusic() {
    this._stopMusic();
  }

  /**
   * 设置总音量。
   *
   * @param {number} volume - 音量 [0, 1]
   */
  setVolume(volume) {
    this._volume = Math.max(0, Math.min(1, volume));
    if (this._masterGain) {
      this._masterGain.gain.setValueAtTime(this._volume, this._ctx.currentTime);
    }
  }

  // ============================================================
  // 内部方法
  // ============================================================

  /**
   * 设置引擎振荡器。
   * 双振荡器叠加（sawtooth + square 带小 detune）使声音更饱满。
   * 初始 gain 为 0（静音），在 playEngine 中按需调整。
   */
  _setupEngine() {
    if (!this._ctx) return;

    const gain = this._ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this._masterGain);
    this._engineGain = gain;

    // 振荡器 1：基础音
    const osc1 = this._ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = ENGINE_FREQ_MIN;
    osc1.connect(gain);

    // 振荡器 2：谐波层（轻微 detune）
    const osc2 = this._ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = ENGINE_FREQ_MIN * 1.5;
    osc2.detune.value = 5;
    osc2.connect(gain);

    this._engineOscs = [osc1, osc2];
  }

  /**
   * 确保 AudioContext 处于运行状态（应对浏览器自动播放策略）。
   */
  _ensureContext() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {});
    }
  }

  /**
   * 播放一个单音 beep。
   *
   * @param {number} freq - 频率（Hz）
   * @param {number} duration - 持续时长（秒）
   */
  _playBeep(freq, duration) {
    if (!this._initialized || !this._pool) return;

    const ctx = this._ctx;
    const now = ctx.currentTime;
    const gain = this._pool.acquire();
    if (!gain) return;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this._masterGain);

    // 音量包络：Attack 10ms → 保持 → Release 20ms
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.setValueAtTime(0.3, now + duration - 0.02);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.05);

    osc.onended = () => {
      osc.disconnect();
      this._pool.release(gain);
    };
  }

  /**
   * 播放一段白噪声（通过 AudioBuffer 生成）。
   * 可选的带通滤波参数。
   *
   * @param {number} duration - 噪声持续时长（秒）
   * @param {number} gainValue - 峰值增益
   * @param {number} [lowpassFreq] - 低通截止频率（Hz）
   * @param {number} [highpassFreq] - 高通截止频率（Hz）
   * @param {Function} [onEnd] - 播放结束回调
   */
  _playNoise(duration, gainValue, lowpassFreq, highpassFreq, onEnd) {
    if (!this._initialized || !this._pool) return;

    const ctx = this._ctx;
    const now = ctx.currentTime;
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.ceil(sampleRate * duration);

    // 生成白噪声
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = this._pool.acquire();
    if (!gain) return;

    // 音量包络
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainValue, now + 0.01);
    gain.gain.setValueAtTime(gainValue, now + duration - 0.02);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    // 串接 filters → gain → master
    let lastNode = source;

    if (lowpassFreq) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = lowpassFreq;
      lastNode.connect(lp);
      lastNode = lp;
    }

    if (highpassFreq) {
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = highpassFreq;
      lastNode.connect(hp);
      lastNode = hp;
    }

    lastNode.connect(gain);
    gain.connect(this._masterGain);

    source.start(now);
    source.stop(now + duration + 0.05);

    source.onended = () => {
      source.disconnect();
      try { gain.disconnect(); } catch (_) { /* 安全忽略 */ }
      this._pool.release(gain);
      if (typeof onEnd === 'function') onEnd();
    };
  }

  /**
   * 停止背景音乐。
   * 遍历所有音乐振荡器：stop() → disconnect()，然后断开并释放 GainNode。
   * 重置音乐播放状态，防止内存泄漏和音频叠加。
   */
  _stopMusic() {
    if (!this._musicPlaying) return;

    // 停止并断开所有振荡器
    for (const osc of this._musicOscs) {
      try {
        osc.stop();
      } catch (_) {
        /* 振荡器可能已停止 */
      }
      try {
        osc.disconnect();
      } catch (_) {
        /* 安全忽略 */
      }
    }
    this._musicOscs.length = 0;

    // 断开并释放音乐 GainNode
    if (this._musicGain) {
      try {
        this._musicGain.disconnect();
      } catch (_) {
        /* 安全忽略 */
      }
      this._musicGain = null;
    }

    this._musicPlaying = false;
  }

  /**
   * 启动环境背景音。
   *
   * @param {number} freq - 振荡器频率
   * @param {OscillatorType} type - 波形类型
   * @param {number} volume - 音量
   */
  _startAmbient(freq, type, volume) {
    if (!this._ctx) return;

    const gain = this._ctx.createGain();
    gain.gain.value = volume;
    gain.connect(this._masterGain);

    const osc = this._ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start();

    this._musicOscs = [osc];
    this._musicGain = gain;
    this._musicPlaying = true;
  }
}
