import router from '@ohos.router';
@Entry
@Component
struct VoiceLogin {
  @State randomNum: string = '00000000'
  @State isPressed: boolean = false
  @State progress: number = 0
  private timer: number | null = null
  private isNavigating: boolean = false  // 防止重复跳转的标志
  generate8DigitRandom(): string { return Math.floor(Math.random() * 100000000).toString().padStart(8, '0') }
  aboutToAppear() { this.randomNum = this.generate8DigitRandom() }
  aboutToDisappear() {
    // 页面销毁时彻底清理定时器
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  // 清理定时器并准备跳转
  private cleanupAndNavigate() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    // 防止重复调用 replaceUrl
    if (!this.isNavigating) {
      this.isNavigating = true;
      router.replaceUrl({ url: 'pages/mainPage' });
    }
  }
  build() {
    Column() {
      // 导航栏：背景#FFFFFF，高度50px，标题18px Bold
      Row() {
        Text('<').fontSize(22).fontColor('rgba(0, 0, 0, 0.9)').margin({ right: 16 }).onClick(() => { router.back() })
        Text('用声音锁登录').fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
      Column() {
        Text('请匀速读出以下数字').fontSize(16).fontColor('rgba(0, 0, 0, 0.55)').margin({ bottom: 30 })
        Text(this.randomNum).fontSize(36).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)').letterSpacing(8).margin({ bottom: 60 })
        Text(this.isPressed ? '正在识别...' : '按住 说话').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)').margin({ bottom: 20 })
        Text('🎤').fontSize(32).width(80).height(80).textAlign(TextAlign.Center)
          .backgroundColor(this.isPressed ? '#07C160' : '#E0E0E0').borderRadius(40)
          .onTouch((event) => {
            if (event.type === TouchType.Down) {
              // 如果已经在跳转中，忽略新的触摸
              if (this.isNavigating) return;
              this.isPressed = true;
              this.progress = 0;
              this.timer = setInterval(() => {
                this.progress += 2;
                if (this.progress >= 100) {
                  // 先清理定时器，再跳转，避免状态更新导致闪烁
                  this.cleanupAndNavigate();
                }
              }, 50);
            } else if (event.type === TouchType.Up) {
              // 如果已经在跳转中，忽略松手事件，避免状态变化导致闪烁
              if (this.isNavigating) return;
              if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
              }
              this.isPressed = false;
              this.progress = 0;
            }
          })
        if (this.progress > 0) { Text(this.progress.toString() + '%').fontSize(14).fontColor('#07C160').margin({ top: 16 }) }
      }.width('100%').layoutWeight(1).justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
    }.width('100%').height('100%').backgroundColor('#FFFFFF')
  }
}
