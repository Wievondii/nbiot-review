import router from '@ohos.router';
@Entry @Component
struct GroupChatPage {
  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('rgba(0, 0, 0, 0.9)').margin({ right: 16 }).onClick(() => { router.back() })
        Text('群聊').fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
      Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')
      Column() {
        Text('👥').fontSize(48).margin({ bottom: 12 })
        Text('暂无群聊').fontSize(16).fontColor('rgba(0, 0, 0, 0.55)')
        Text('发起一个群聊吧').fontSize(14).fontColor('rgba(0, 0, 0, 0.3)').margin({ top: 8 })
      }.width('100%').layoutWeight(1).justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center).backgroundColor('#EDEDED')
    }.width('100%').height('100%').backgroundColor('#EDEDED').justifyContent(FlexAlign.Start).alignItems(HorizontalAlign.Start)
  }
}
