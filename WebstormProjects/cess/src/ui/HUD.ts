/**
 * HUD (Heads-Up Display) 组件
 * 显示生命值、弹药、分数、波次信息
 */

export class HUD {
  private container: HTMLElement;
  private healthBar!: HTMLElement;
  private healthValue!: HTMLElement;
  private ammoCurrent!: HTMLElement;
  private ammoMax!: HTMLElement;
  private scoreValue!: HTMLElement;
  private waveNumber!: HTMLElement;
  private waveZombies!: HTMLElement;
  private comboDisplay!: HTMLElement;
  private crosshair!: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.createHUD();
  }

  /**
   * 创建HUD元素
   */
  private createHUD(): void {
    this.container.innerHTML = `
      <!-- 准星 -->
      <div class="crosshair">
        <div class="crosshair-dot"></div>
      </div>

      <!-- 波次信息 -->
      <div class="hud-wave">
        <div class="wave-number">WAVE <span id="wave-num">1</span></div>
        <div class="wave-zombies">剩余: <span id="wave-zombies">0</span> 只</div>
      </div>

      <!-- 连杀显示 -->
      <div class="combo-display" id="combo-display"></div>

      <!-- 左下角：生命值 -->
      <div class="hud-panel hud-health">
        <div class="health-text">生命值</div>
        <div class="health-value" id="health-value">100</div>
        <div class="health-bar-container">
          <div class="health-bar" id="health-bar" style="width: 100%"></div>
        </div>
      </div>

      <!-- 中下：弹药 -->
      <div class="hud-panel hud-ammo">
        <div class="ammo-current" id="ammo-current">12</div>
        <span class="ammo-separator">/</span>
        <span class="ammo-max" id="ammo-max">12</span>
        <div class="ammo-label">弹药</div>
      </div>

      <!-- 右下角：得分 -->
      <div class="hud-panel hud-score">
        <div class="score-label">得分</div>
        <div class="score-value" id="score-value">0</div>
      </div>
    `;

    // 获取元素引用
    this.healthBar = this.container.querySelector('#health-bar')!;
    this.healthValue = this.container.querySelector('#health-value')!;
    this.ammoCurrent = this.container.querySelector('#ammo-current')!;
    this.ammoMax = this.container.querySelector('#ammo-max')!;
    this.scoreValue = this.container.querySelector('#score-value')!;
    this.waveNumber = this.container.querySelector('#wave-num')!;
    this.waveZombies = this.container.querySelector('#wave-zombies')!;
    this.comboDisplay = this.container.querySelector('#combo-display')!;
    this.crosshair = this.container.querySelector('.crosshair')!;
  }

  /**
   * 显示HUD
   */
  show(): void {
    this.container.style.display = 'flex';
  }

  /**
   * 隐藏HUD
   */
  hide(): void {
    this.container.style.display = 'none';
  }

  /**
   * 更新生命值显示
   * @param health 当前生命值
   * @param maxHealth 最大生命值
   */
  updateHealth(health: number, maxHealth: number): void {
    const percent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    this.healthBar.style.width = `${percent}%`;
    this.healthValue.textContent = Math.ceil(health).toString();

    // 三级生命值警告效果
    if (percent < 25) {
      // 低血量：红色警告
      this.healthBar.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
      this.healthValue.style.color = '#ff4444';
    } else if (percent < 50) {
      // 中等血量：橙色警告（锈橙色系）
      this.healthBar.style.background = 'linear-gradient(90deg, #8b4513, #a0522d)';
      this.healthValue.style.color = '#a0522d';
    } else {
      // 高血量：正常暗红色
      this.healthBar.style.background = 'linear-gradient(90deg, #8b0000, #b22222)';
      this.healthValue.style.color = '#b22222';
    }
  }

  /**
   * 更新弹药显示
   * @param current 当前弹药
   * @param max 最大弹药
   */
  updateAmmo(current: number, max: number): void {
    this.ammoCurrent.textContent = current.toString();
    this.ammoMax.textContent = max.toString();

    // 低弹药警告
    if (current === 0) {
      this.ammoCurrent.style.color = '#ff4444';
    } else if (current <= max * 0.25) {
      this.ammoCurrent.style.color = '#ffa500';
    } else {
      this.ammoCurrent.style.color = '#ffffff';
    }
  }

  /**
   * 更新分数显示
   * @param score 当前分数
   */
  updateScore(score: number): void {
    this.scoreValue.textContent = score.toLocaleString();
  }

  /**
   * 更新波次信息
   * @param wave 波次编号
   * @param zombiesRemaining 剩余僵尸数
   */
  updateWave(wave: number, zombiesRemaining: number): void {
    this.waveNumber.textContent = wave.toString();
    this.waveZombies.textContent = zombiesRemaining.toString();
  }

  /**
   * 显示连杀提示
   * @param combo 连杀数
   */
  showCombo(combo: number): void {
    if (combo < 2) {
      this.comboDisplay.classList.remove('active');
      return;
    }

    let text = '';
    if (combo >= 10) text = 'UNSTOPPABLE!';
    else if (combo >= 7) text = 'RAMPAGE!';
    else if (combo >= 5) text = 'KILLING SPREE!';
    else if (combo >= 3) text = 'MULTI KILL!';
    else text = `${combo}x COMBO`;

    this.comboDisplay.textContent = text;
    this.comboDisplay.classList.remove('active');
    // 触发重绘以重新播放动画
    void this.comboDisplay.offsetWidth;
    this.comboDisplay.classList.add('active');
  }

  /**
   * 隐藏连杀提示
   */
  hideCombo(): void {
    this.comboDisplay.classList.remove('active');
  }

  /**
   * 显示/隐藏准星
   * @param show 是否显示
   */
  showCrosshair(show: boolean): void {
    this.crosshair.style.display = show ? 'block' : 'none';
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.container.remove();
  }
}
