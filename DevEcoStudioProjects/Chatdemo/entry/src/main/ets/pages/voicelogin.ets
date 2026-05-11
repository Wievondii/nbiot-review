import router from '@ohos.router';
@Entry
@Component
struct VoiceLogin {
  @State randomNum: string = '00000000'
  @State isPressed: boolean = false
  @State progress: number = 0
  private timer: number | null = null
  generate8DigitRandom(): string { return Math.floor(Math.random() * 100000000).toString().padStart(8, '0') }
  aboutToAppear() { this.randomNum = this.generate8DigitRandom() }
  aboutToDisappear() { if (this.timer) { clearInterval(this.timer); this.timer = null } }
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
              this.isPressed = true; this.progress = 0
              this.timer = setInterval(() => {
                this.progress += 2
                if (this.progress >= 100) { if (this.timer) { clearInterval(this.timer); this.timer = null }; router.replaceUrl({ url: 'pages/mainPage' }) }
              }, 50)
            } else if (event.type === TouchType.Up) {
              if (this.timer) { clearInterval(this.timer); this.timer = null }; this.isPressed = false; this.progress = 0
            }
          })
        if (this.progress > 0) { Text(this.progress.toString() + '%').fontSize(14).fontColor('#07C160').margin({ top: 16 }) }
      }.width('100%').layoutWeight(1).justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
    }.width('100%').height('100%').backgroundColor('#FFFFFF')
  }
}
