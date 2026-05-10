/**
 * 音频管理器
 * 使用 Web Audio API 实现音效和背景音乐播放
 * 支持音量控制、静音、音效复用
 */
import { IAudioManager, SoundIds } from '../types';

/** 音效配置接口 */
interface SoundConfig {
  /** 音频文件路径 */
  url: string;
  /** 默认音量 (0-1) */
  volume: number;
  /** 是否循环 */
  loop: boolean;
  /** 音频类型 */
  type: 'sfx' | 'music';
}

/** 音效资源配置表 */
const SOUND_CONFIGS: Record<string, SoundConfig> = {
  // 武器音效
  [SoundIds.PISTOL_FIRE]: { url: '/assets/sounds/pistol_fire.mp3', volume: 0.6, loop: false, type: 'sfx' },
  [SoundIds.SHOTGUN_FIRE]: { url: '/assets/sounds/shotgun_fire.mp3', volume: 0.7, loop: false, type: 'sfx' },
  [SoundIds.RIFLE_FIRE]: { url: '/assets/sounds/rifle_fire.mp3', volume: 0.65, loop: false, type: 'sfx' },
  [SoundIds.RELOAD]: { url: '/assets/sounds/reload.mp3', volume: 0.5, loop: false, type: 'sfx' },
  [SoundIds.EMPTY_CLIP]: { url: '/assets/sounds/empty_clip.mp3', volume: 0.4, loop: false, type: 'sfx' },

  // 僵尸音效
  [SoundIds.ZOMBIE_GROWL]: { url: '/assets/sounds/zombie_growl.mp3', volume: 0.5, loop: false, type: 'sfx' },
  [SoundIds.ZOMBIE_ATTACK]: { url: '/assets/sounds/zombie_attack.mp3', volume: 0.6, loop: false, type: 'sfx' },
  [SoundIds.ZOMBIE_DEATH]: { url: '/assets/sounds/zombie_death.mp3', volume: 0.5, loop: false, type: 'sfx' },
  [SoundIds.ZOMBIE_HIT]: { url: '/assets/sounds/zombie_hit.mp3', volume: 0.4, loop: false, type: 'sfx' },

  // UI音效
  [SoundIds.MENU_CLICK]: { url: '/assets/sounds/menu_click.mp3', volume: 0.5, loop: false, type: 'sfx' },
  [SoundIds.MENU_HOVER]: { url: '/assets/sounds/menu_hover.mp3', volume: 0.3, loop: false, type: 'sfx' },
  [SoundIds.WAVE_START]: { url: '/assets/sounds/wave_start.mp3', volume: 0.7, loop: false, type: 'sfx' },
  [SoundIds.WAVE_COMPLETE]: { url: '/assets/sounds/wave_complete.mp3', volume: 0.7, loop: false, type: 'sfx' },
  [SoundIds.GAME_OVER]: { url: '/assets/sounds/game_over.mp3', volume: 0.8, loop: false, type: 'sfx' },
  [SoundIds.PLAYER_HURT]: { url: '/assets/sounds/player_hurt.mp3', volume: 0.6, loop: false, type: 'sfx' },

  // 背景音乐
  [SoundIds.MUSIC_MENU]: { url: '/assets/sounds/music_menu.mp3', volume: 0.4, loop: true, type: 'music' },
  [SoundIds.MUSIC_GAME]: { url: '/assets/sounds/music_game.mp3', volume: 0.3, loop: true, type: 'music' },
};

export class AudioManager implements IAudioManager {
  /** Web Audio API 上下文 */
  private audioContext: AudioContext | null = null;

  /** 已加载的音频缓冲区缓存 */
  private audioBuffers: Map<string, AudioBuffer> = new Map();

  /** 当前正在播放的音乐源 */
  private currentMusicSource: AudioBufferSourceNode | null = null;

  /** 当前音乐增益节点 */
  private musicGainNode: GainNode | null = null;

  /** 主音量 (0-1) */
  private masterVolume: number = 1.0;

  /** 音效音量 (0-1) */
  private sfxVolume: number = 1.0;

  /** 音乐音量 (0-1) */
  private musicVolume: number = 0.5;

  /** 是否静音 */
  private muted: boolean = false;

  /** 是否已初始化 */
  private initialized: boolean = false;

  /** 当前播放的音乐ID */
  private currentMusicId: string | null = null;

  /**
   * 初始化音频系统
   * 需要用户交互后才能创建 AudioContext
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
      console.log('[Audio] 音频系统初始化成功');

      // 预加载常用音效
      await this.preloadCommonSounds();
    } catch (e) {
      console.error('[Audio] 音频系统初始化失败:', e);
    }
  }

  /**
   * 预加载常用音效
   */
  private async preloadCommonSounds(): Promise<void> {
    const commonSounds = [
      SoundIds.PISTOL_FIRE,
      SoundIds.ZOMBIE_GROWL,
      SoundIds.ZOMBIE_DEATH,
      SoundIds.MENU_CLICK,
      SoundIds.PLAYER_HURT,
    ];

    await Promise.all(commonSounds.map(id => this.loadSound(id)));
  }

  /**
   * 加载音频文件
   * @param soundId 音效ID
   */
  private async loadSound(soundId: string): Promise<void> {
    if (this.audioBuffers.has(soundId)) return;
    if (!this.audioContext) return;

    const config = SOUND_CONFIGS[soundId];
    if (!config) {
      console.warn(`[Audio] 未知音效ID: ${soundId}`);
      return;
    }

    try {
      const response = await fetch(config.url);
      if (!response.ok) {
        console.warn(`[Audio] 音效文件加载失败: ${config.url}`);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(soundId, audioBuffer);
      console.log(`[Audio] 音效加载成功: ${soundId}`);
    } catch (e) {
      console.warn(`[Audio] 音效加载错误 ${soundId}:`, e);
    }
  }

  /**
   * 播放音效
   * @param soundId 音效ID
   */
  playSound(soundId: string): void {
    if (this.muted || !this.audioContext || !this.initialized) return;

    // 恢复音频上下文（Chrome自动暂停策略）
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const buffer = this.audioBuffers.get(soundId);
    if (!buffer) {
      // 异步加载后播放
      this.loadSound(soundId).then(() => {
        const loadedBuffer = this.audioBuffers.get(soundId);
        if (loadedBuffer) {
          this.playBuffer(loadedBuffer, soundId);
        }
      });
      return;
    }

    this.playBuffer(buffer, soundId);
  }

  /**
   * 播放音频缓冲区
   * @param buffer 音频缓冲区
   * @param soundId 音效ID
   */
  private playBuffer(buffer: AudioBuffer, soundId: string): void {
    if (!this.audioContext) return;

    const config = SOUND_CONFIGS[soundId];
    const volume = config ? config.volume : 1.0;

    // 创建源节点
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // 创建增益节点控制音量
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume * this.sfxVolume * this.masterVolume;

    // 连接节点
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 播放
    source.start(0);
  }

  /**
   * 播放背景音乐
   * @param musicId 音乐ID
   */
  playMusic(musicId: string): void {
    if (!this.audioContext || !this.initialized) return;

    // 如果正在播放相同的音乐，不重复播放
    if (this.currentMusicId === musicId && this.currentMusicSource) {
      return;
    }

    // 停止当前音乐
    this.stopMusic();

    // 恢复音频上下文
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const buffer = this.audioBuffers.get(musicId);
    if (!buffer) {
      this.loadSound(musicId).then(() => {
        const loadedBuffer = this.audioBuffers.get(musicId);
        if (loadedBuffer) {
          this.startMusic(loadedBuffer, musicId);
        }
      });
      return;
    }

    this.startMusic(buffer, musicId);
  }

  /**
   * 开始播放音乐
   * @param buffer 音频缓冲区
   * @param musicId 音乐ID
   */
  private startMusic(buffer: AudioBuffer, musicId: string): void {
    if (!this.audioContext) return;

    const config = SOUND_CONFIGS[musicId];
    const volume = config ? config.volume : 0.5;

    // 创建源节点
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = config?.loop ?? true;

    // 创建增益节点
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume * this.musicVolume * this.masterVolume;

    // 连接节点
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 播放
    source.start(0);

    this.currentMusicSource = source;
    this.musicGainNode = gainNode;
    this.currentMusicId = musicId;

    // 循环播放结束时重新开始（非loop模式）
    source.onended = () => {
      if (this.currentMusicId === musicId) {
        this.currentMusicSource = null;
        this.musicGainNode = null;
        this.currentMusicId = null;
      }
    };
  }

  /**
   * 停止背景音乐
   */
  stopMusic(): void {
    if (this.currentMusicSource) {
      try {
        this.currentMusicSource.stop();
      } catch (e) {
        // 忽略已经停止的错误
      }
      this.currentMusicSource = null;
      this.musicGainNode = null;
      this.currentMusicId = null;
    }
  }

  /**
   * 设置主音量
   * @param volume 音量值 (0-1)
   */
  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
  }

  /**
   * 获取主音量
   */
  getVolume(): number {
    return this.masterVolume;
  }

  /**
   * 设置音效音量
   * @param volume 音量值 (0-1)
   */
  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 设置音乐音量
   * @param volume 音量值 (0-1)
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
  }

  /**
   * 更新当前音乐音量
   */
  private updateMusicVolume(): void {
    if (this.musicGainNode && this.currentMusicId) {
      const config = SOUND_CONFIGS[this.currentMusicId];
      const volume = config ? config.volume : 0.5;
      this.musicGainNode.gain.value = volume * this.musicVolume * this.masterVolume;
    }
  }

  /**
   * 静音
   */
  mute(): void {
    this.muted = true;
    this.stopMusic();
  }

  /**
   * 取消静音
   */
  unmute(): void {
    this.muted = false;
  }

  /**
   * 是否静音
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.stopMusic();
    this.audioBuffers.clear();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.initialized = false;
  }
}
