import { DataManager } from '../util/DataManager';
import router from '@ohos.router';

@Entry
@Component
struct NewFriendPage {
  private dataManager: DataManager = DataManager.getInstance()
  @State friendStatus: boolean[] = [true, true, false, false, true]
  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('rgba(0, 0, 0, 0.9)').margin({ right: 16 })
          .onClick(() => { router.back() })
        Text('新的朋友').fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
      Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')
      List() {
        ListItem() { this.friendItem('小明', '我是小明', 0, 0) }
        ListItem() { this.friendItem('小红', '我是小红，同事介绍', 1, 1) }
        ListItem() { this.friendItem('小刚', '我是小刚，大学同学', 2, 2) }
        ListItem() { this.friendItem('小李', '我是小李', 0, 3) }
        ListItem() { this.friendItem('小王', '我是小王，邻居', 1, 4) }
      }.layoutWeight(1).divider({ strokeWidth: 0.5, color: 'rgba(0, 0, 0, 0.1)', startMargin: 76, endMargin: 0 })
    }.width('100%').height('100%').backgroundColor('#EDEDED').justifyContent(FlexAlign.Start).alignItems(HorizontalAlign.Start)
  }

  @Builder
  friendItem(name: string, desc: string, avatarIndex: number, index: number) {
    Row() {
      Image($r('app.media.' + this.dataManager.getAvatar(avatarIndex)))
        .width(48).height(48).borderRadius(6).margin({ right: 12 })
      Column() {
        Text(name).fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
        Text(desc).fontSize(14).fontColor('rgba(0, 0, 0, 0.55)').margin({ top: 4 })
      }.alignItems(HorizontalAlign.Start).layoutWeight(1)
      if (this.friendStatus[index]) {
        Text('已添加').fontSize(14).fontColor('rgba(0, 0, 0, 0.3)')
          .padding({ left: 12, right: 12, top: 6, bottom: 6 })
          .backgroundColor('#F5F5F5').borderRadius(4)
      } else {
        Button('添加').fontSize(14).fontColor('#FFFFFF').backgroundColor('#07C160')
          .width(60).height(32).borderRadius(4)
          .onClick(() => {
            let newArr: boolean[] = []
            for (let i = 0; i < this.friendStatus.length; i++) {
              newArr.push(i === index ? true : this.friendStatus[i])
            }
            this.friendStatus = newArr
            this.getUIContext().getPromptAction().showToast({ message: '已添加' + name, duration: 1500 })
          })
      }
    }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
  }
}
