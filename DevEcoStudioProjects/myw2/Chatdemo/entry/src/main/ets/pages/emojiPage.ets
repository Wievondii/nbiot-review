import router from '@ohos.router'

@Entry
@Component
struct EmojiPage {
  @State selectedCategory: number = 0
  @State recentEmojis: string[] = []

  private categories: string[] = ['精选', '表情包', '食物', '动物', '手势', '物品']
  private emojiData: string[][] = [
    ['\u{1F60A}', '\u{1F602}', '\u{1F970}', '\u{1F60E}', '\u{1F929}', '\u{1F914}', '\u{1F92F}', '\u{1F9D0}', '\u{1F607}', '\u{1F608}', '\u{1F47B}', '\u{1F4A9}'],
    ['\u{1F431}', '\u{1F436}', '\u{1F430}', '\u{1F43B}', '\u{1F43C}', '\u{1F428}', '\u{1F42F}', '\u{1F42E}', '\u{1F437}', '\u{1F435}', '\u{1F412}', '\u{1F414}'],
    ['\u{1F34E}', '\u{1F34A}', '\u{1F34B}', '\u{1F353}', '\u{1F352}', '\u{1F351}', '\u{1F34D}', '\u{1F349}', '\u{1F347}', '\u{1F350}', '\u{1F34F}', '\u{1F345}'],
    ['\u{1F44D}', '\u{1F44E}', '\u{1F44B}', '\u{1F44F}', '\u{1F44A}', '\u{270A}', '\u{270C}', '\u{1F91E}', '\u{1F91F}', '\u{1F44C}', '\u{270B}', '\u{1F590}'],
    ['\u{2764}\u{FE0F}', '\u{1F494}', '\u{1F4AF}', '\u{1F48E}', '\u{2B50}', '\u{1F31F}', '\u{1F525}', '\u{1F4A5}', '\u{1F308}', '\u{2600}\u{FE0F}', '\u{1F319}', '\u{26C4}']
  ]

  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('rgba(0, 0, 0, 0.9)').margin({ right: 16 })
          .onClick(() => { router.back() })
        Text('表情').fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')

      Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')

      Row() {
        ForEach(this.categories, (cat: string, index: number) => {
          Column() {
            Text(cat).fontSize(13).fontColor(this.selectedCategory === index ? '#07C160' : 'rgba(0, 0, 0, 0.55)')
              .fontWeight(this.selectedCategory === index ? FontWeight.Bold : FontWeight.Normal)
          }.layoutWeight(1).height(40).justifyContent(FlexAlign.Center)
            .onClick(() => { this.selectedCategory = index })
        })
      }.width('100%').backgroundColor('#FFFFFF')

      Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')

      Grid() {
        ForEach(this.emojiData[this.selectedCategory], (emoji: string) => {
          GridItem() {
            Column() {
              Text(emoji).fontSize(32)
            }.width('100%').height('100%').justifyContent(FlexAlign.Center)
              .onClick(() => {
                this.recentEmojis.push(emoji)
                this.getUIContext().getPromptAction().showToast({ message: '已选择: ' + emoji, duration: 1000 })
              })
          }
        })
      }.columnsTemplate('1fr 1fr 1fr 1fr 1fr 1fr')
        .rowsTemplate('1fr 1fr 1fr')
        .width('100%').layoutWeight(1).backgroundColor('#FFFFFF')
        .padding(8)

      if (this.recentEmojis.length > 0) {
        Column() {
          Text('最近使用').fontSize(13).fontColor('rgba(0, 0, 0, 0.55)').width('100%').padding({ left: 16, top: 8, bottom: 8 })
          Row() {
            ForEach(this.recentEmojis.slice(-6), (emoji: string, index: number) => {
              Text(emoji).fontSize(28).margin({ left: 12, right: 12 })
            })
          }.width('100%').height(48).justifyContent(FlexAlign.Center)
        }.width('100%').backgroundColor('#F5F5F5')
      }
    }.width('100%').height('100%').backgroundColor('#EDEDED').justifyContent(FlexAlign.Start).alignItems(HorizontalAlign.Start)
  }
}
