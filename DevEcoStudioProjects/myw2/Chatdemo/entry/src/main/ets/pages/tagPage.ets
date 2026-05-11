import router from '@ohos.router';

@Entry
@Component
struct TagPage {
  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('rgba(0, 0, 0, 0.9)').margin({ right: 16 })
          .onClick(() => { router.back() })
        Text('标签').fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')

      List() {
        this.tagItem('同事', '12人')
        this.tagItem('家人', '8人')
        this.tagItem('同学', '15人')
        this.tagItem('朋友', '20人')
        this.tagItem('客户', '5人')
        this.tagItem('供应商', '3人')
      }.layoutWeight(1).divider({ strokeWidth: 0 })
    }.width('100%').height('100%').backgroundColor('#EDEDED').justifyContent(FlexAlign.Start).alignItems(HorizontalAlign.Start)
  }

  @Builder
  tagItem(name: string, count: string) {
    ListItem() {
      Row() {
        Text('🏷️').fontSize(24).width(40).height(40).textAlign(TextAlign.Center)
          .backgroundColor('#F5A623').borderRadius(6).margin({ right: 12 })
        Column() {
          Text(name).fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
          Text(count).fontSize(12).fontColor('rgba(0, 0, 0, 0.55)').margin({ top: 4 })
        }.alignItems(HorizontalAlign.Start)
      }.width('100%').height(68).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
    }.onClick(() => { this.getUIContext().getPromptAction().showToast({ message: name, duration: 1500 }) })
  }
}
