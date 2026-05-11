import router from '@ohos.router';
@Entry
@Component
struct ScanPage {
  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('#FFFFFF').margin({ right: 16 }).onClick(() => { router.back() })
        Text('扫一扫').fontSize(18).fontWeight(FontWeight.Bold).fontColor('#FFFFFF')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#00000000')
      Column() {
        Stack({ alignContent: Alignment.Center }) {
          Column() { }.width(240).height(240)
            .border({ width: 2, color: '#07C160' }).borderRadius(12)
          Column() {
            Row() { }.width(240).height(2).backgroundColor('#07C160')
          }.width(240).height(240).justifyContent(FlexAlign.Start)
        }.width(240).height(240)
        Text('将二维码/条码放入框内，即可自动扫描').fontSize(14).fontColor('#FFFFFF').margin({ top: 30 })
        Row({ space: 40 }) {
          Column() { Text('💡').fontSize(28); Text('闪光灯').fontSize(12).fontColor('#FFFFFF').margin({ top: 6 }) }
          Column() { Text('🖼️').fontSize(28); Text('相册').fontSize(12).fontColor('#FFFFFF').margin({ top: 6 }) }
        }.margin({ top: 40 })
      }.width('100%').layoutWeight(1).justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center).backgroundColor('#000000')
    }.width('100%').height('100%').backgroundColor('#000000').justifyContent(FlexAlign.Start).alignItems(HorizontalAlign.Start)
  }
}
