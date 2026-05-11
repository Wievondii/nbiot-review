import router from '@ohos.router';
@Entry
@Component
struct ShakePage {
  @State shaking: boolean = false
  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('#FFFFFF').margin({ right: 16 }).onClick(() => { router.back() })
        Text('摇一摇').fontSize(18).fontWeight(FontWeight.Bold).fontColor('#FFFFFF')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#00000000')
      Column() {
        Text(this.shaking ? '📱' : '📲').fontSize(80).margin({ bottom: 20 })
          .onClick(() => {
            this.shaking = true
            setTimeout(() => { this.shaking = false }, 2000)
          })
        Text(this.shaking ? '正在匹配...' : '摇一摇手机').fontSize(18).fontWeight(FontWeight.Bold).fontColor('#FFFFFF').margin({ bottom: 8 })
        Text(this.shaking ? '正在寻找附近的人' : '发现附近的人').fontSize(14).fontColor('#AAAAAA')
        Row({ space: 30 }) {
          Column() { Text('👤').fontSize(28); Text('人').fontSize(12).fontColor('#FFFFFF').margin({ top: 6 }) }
          Column() { Text('🎵').fontSize(28); Text('音乐').fontSize(12).fontColor('#FFFFFF').margin({ top: 6 }) }
          Column() { Text('📺').fontSize(28); Text('电视').fontSize(12).fontColor('#FFFFFF').margin({ top: 6 }) }
        }.margin({ top: 40 })
      }.width('100%').layoutWeight(1).justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center).backgroundColor('#1A1A1A')
    }.width('100%').height('100%').backgroundColor('#1A1A1A').justifyContent(FlexAlign.Start).alignItems(HorizontalAlign.Start)
  }
}
