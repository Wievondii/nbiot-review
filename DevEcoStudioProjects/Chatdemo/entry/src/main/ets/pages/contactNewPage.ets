import router from '@ohos.router';
@Entry
@Component
struct ContactNewPage {
  @State title: string = '页面'
  aboutToAppear() {
    const params = router.getParams() as Record<string, string>
    if (params && params.title) { this.title = params.title }
  }
  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('#000000').margin({ right: 16 }).onClick(() => { router.back() })
        Text(this.title).fontSize(18).fontWeight(FontWeight.Bold).fontColor('#000000')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
      Column() {
        Text('功能开发中...').fontSize(16).fontColor('#999999')
      }.width('100%').layoutWeight(1).justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center).backgroundColor('#EDEDED')
    }.width('100%').height('100%').backgroundColor('#EDEDED')
  }
}