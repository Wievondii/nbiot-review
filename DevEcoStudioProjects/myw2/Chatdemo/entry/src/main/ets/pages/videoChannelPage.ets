import { DataManager, VideoItem } from '../util/DataManager'
import router from '@ohos.router'

@Entry
@Component
struct VideoChannelPage {
  @State videoList: VideoItem[] = []
  @State currentIndex: number = 0
  @State likedSet: Set<number> = new Set()
  private dataManager: DataManager = DataManager.getInstance()

  aboutToAppear() {
    this.videoList = this.dataManager.getVideoList()
  }

  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('#FFFFFF').margin({ right: 16 })
          .onClick(() => { router.back() })
        Text('视频号').fontSize(18).fontWeight(FontWeight.Bold).fontColor('#FFFFFF')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#000000')

      Swiper() {
        ForEach(this.videoList, (item: VideoItem, index: number) => {
          Stack({ alignContent: Alignment.BottomEnd }) {
            Column() {
              Text(item.coverDesc).fontSize(28).fontColor('#FFFFFF')
                .textAlign(TextAlign.Center)
            }.width('100%').height('100%')
              .backgroundColor('#1A1A1A')
              .justifyContent(FlexAlign.Center)

            Row() {
              Column() {
                Image($r('app.media.' + this.dataManager.getAvatar(item.avatarIndex)))
                  .width(40).height(40).borderRadius(20)
                  .border({ width: 2, color: '#FFFFFF' })
                  .margin({ bottom: 16 })

                Column() {
                  Text(this.likedSet.has(item.id) ? '\u{2764}\u{FE0F}' : '\u{2661}').fontSize(24)
                    .fontColor(this.likedSet.has(item.id) ? '#F44336' : '#FFFFFF')
                  Text((item.likeCount + (this.likedSet.has(item.id) ? 1 : 0)).toString())
                    .fontSize(11).fontColor('#FFFFFF')
                }.margin({ bottom: 16 }).alignItems(HorizontalAlign.Center)
                  .onClick(() => {
                    let newSet = new Set<number>()
                    for (const id of this.likedSet) { newSet.add(id) }
                    if (newSet.has(item.id)) {
                      newSet.delete(item.id)
                    } else {
                      newSet.add(item.id)
                    }
                    this.likedSet = newSet
                  })

                Column() {
                  Text('\u{1F4AC}').fontSize(24).fontColor('#FFFFFF')
                  Text(item.commentCount.toString()).fontSize(11).fontColor('#FFFFFF')
                }.margin({ bottom: 16 }).alignItems(HorizontalAlign.Center)
                  .onClick(() => {
                    this.getUIContext().getPromptAction().showToast({ message: '评论: ' + item.commentCount, duration: 1500 })
                  })

                Column() {
                  Text('\u{27A1}\u{FE0F}').fontSize(24).fontColor('#FFFFFF')
                  Text('分享').fontSize(11).fontColor('#FFFFFF')
                }.alignItems(HorizontalAlign.Center)
                  .onClick(() => {
                    this.getUIContext().getPromptAction().showToast({ message: '分享', duration: 1500 })
                  })
              }.margin({ right: 12 })

              Column() {
                Text(item.title).fontSize(16).fontColor('#FFFFFF').fontWeight(FontWeight.Bold)
                  .margin({ bottom: 6 }).maxLines(2)
                Row() {
                  Text('@' + item.author).fontSize(13).fontColor('#CCCCCC')
                  Text(' · ' + item.likeCount.toString() + '赞').fontSize(13).fontColor('#999999')
                }
              }.layoutWeight(1).alignItems(HorizontalAlign.Start)
            }.width('100%').padding({ left: 16, right: 16, bottom: 40 })
          }.width('100%').height('100%')
        })
      }.index(this.currentIndex)
        .autoPlay(false)
        .vertical(true)
        .indicator(false)
        .layoutWeight(1)
        .onChange((index: number) => { this.currentIndex = index })
    }.width('100%').height('100%').backgroundColor('#000000').justifyContent(FlexAlign.Start).alignItems(HorizontalAlign.Start)
  }
}
