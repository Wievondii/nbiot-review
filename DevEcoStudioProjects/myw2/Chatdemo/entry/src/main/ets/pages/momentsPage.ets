import { DataManager, MomentItem, MomentComment } from '../util/DataManager';
import router from '@ohos.router';
@Entry
@Component
struct MomentsPage {
  @State momentsList: MomentItem[] = []
  @State commentMomentId: number = -1
  @State commentText: string = ''
  private dataManager: DataManager = DataManager.getInstance()
  aboutToAppear() { this.momentsList = this.deepCopyList() }
  deepCopyList(): MomentItem[] {
    let newList: MomentItem[] = []
    for (const m of this.dataManager.getMomentsList()) {
      let newComments: MomentComment[] = []
      for (const c of m.comments) {
        newComments.push({ id: c.id, userName: c.userName, content: c.content, time: c.time, avatarIndex: c.avatarIndex })
      }
      newList.push({ id: m.id, userName: m.userName, content: m.content, time: m.time, likeCount: m.likeCount, commentCount: m.commentCount, avatarIndex: m.avatarIndex, liked: m.liked, comments: newComments })
    }
    return newList
  }
  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('#FFFFFF').margin({ right: 16 }).onClick(() => { router.back() })
        Text('朋友圈').fontSize(18).fontWeight(FontWeight.Bold).fontColor('#FFFFFF')
        Blank()
        Text('📷').fontSize(22).fontColor('#FFFFFF').onClick(() => { router.pushUrl({ url: 'pages/postMomentPage' }) })
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#2E2E2E')
      List() {
        ListItem() {
          Stack({ alignContent: Alignment.BottomEnd }) {
            Stack({ alignContent: Alignment.BottomStart }) {
              Image($r('app.media.monmentbackground')).width('100%').height(260).objectFit(ImageFit.Cover)
              Column() {
                Text('更换封面').fontSize(12).fontColor('#FFFFFF')
              }.padding({ left: 12, right: 12, top: 4, bottom: 4 })
              .backgroundColor('#00000060').borderRadius(4)
              .margin({ left: 16, bottom: 16 })
              .onClick(() => {
                this.getUIContext().getPromptAction().showToast({ message: '更换封面功能开发中', duration: 1500 })
              })
            }.width('100%').height(260)

            Row() {
              Blank()
              Column() {
                Text('泡泡').fontSize(18).fontWeight(FontWeight.Bold).fontColor('#FFFFFF')
                  .textAlign(TextAlign.End)
              }.alignItems(HorizontalAlign.End)
              Image($r('app.media.headImage')).width(64).height(64).borderRadius(8).margin({ left: 12 })
                .border({ width: 2, color: '#FFFFFF' })
            }.width('100%').padding({ left: 16, right: 16, bottom: 16 })
          }.width('100%').height(260)
        }
        ForEach(this.momentsList, (item: MomentItem) => {
          ListItem() {
            Column() {
              Row() {
                Image($r('app.media.' + this.dataManager.getAvatar(item.avatarIndex)))
                  .width(40).height(40).borderRadius(6).margin({ right: 12 }).flexShrink(0)
                Column() {
                  Text(item.userName).fontSize(15).fontWeight(FontWeight.Bold).fontColor('#576B95')
                    .textAlign(TextAlign.Start).margin({ bottom: 6 })
                  Text(item.content).fontSize(15).fontColor('rgba(0, 0, 0, 0.9)').textAlign(TextAlign.Start).margin({ bottom: 8 })
                  Row() {
                    Text(item.time).fontSize(12).fontColor('rgba(0, 0, 0, 0.3)')
                    Blank()
                    Row({ space: 4 }) {
                      Text(item.liked ? '❤️' : '♡')
                        .fontSize(14).fontColor(item.liked ? '#FA5151' : '#999999')
                        .padding({ left: 8, right: 8, top: 4, bottom: 4 })
                        .onClick(() => {
                          this.dataManager.toggleLike(item.id)
                          this.momentsList = this.deepCopyList()
                        })
                      if (item.likeCount > 0) {
                        Text(item.likeCount.toString())
                          .fontSize(12).fontColor('#999999')
                      }
                      Text('💬')
                        .fontSize(14).fontColor('#999999').margin({ left: 12 })
                        .padding({ left: 8, right: 8, top: 4, bottom: 4 })
                        .onClick(() => {
                          if (this.commentMomentId === item.id) {
                            this.commentMomentId = -1
                          } else {
                            this.commentMomentId = item.id
                            this.commentText = ''
                          }
                        })
                      if (item.commentCount > 0) {
                        Text(item.commentCount.toString())
                          .fontSize(12).fontColor('#999999')
                      }
                    }
                  }.width('100%')
                  if (item.liked || item.comments.length > 0) {
                    Column() {
                      if (item.liked) {
                        Row() {
                          Text('❤️ ').fontSize(12)
                          Text('泡泡').fontSize(12).fontColor('#576B95')
                        }.width('100%').margin({ bottom: 2 })
                      }
                      ForEach(item.comments, (comment: MomentComment) => {
                        Row() {
                          Text(comment.userName).fontSize(12).fontColor('#576B95')
                          Text(': ' + comment.content).fontSize(12).fontColor('rgba(0, 0, 0, 0.9)')
                        }.width('100%').margin({ top: 2, bottom: 2 })
                      }, (comment: MomentComment) => comment.id.toString())
                    }.width('100%').margin({ top: 8 }).padding(8).backgroundColor('#F5F5F5').borderRadius(4)
                  }
                  if (this.commentMomentId === item.id) {
                    Row() {
                      TextInput({ text: this.commentText, placeholder: '评论...' })
                        .layoutWeight(1).height(36).fontSize(14).borderRadius(6)
                        .onChange((val: string) => { this.commentText = val })
                      Button('发送').width(56).height(36).fontSize(14)
                        .backgroundColor('#07C160').fontColor('#FFFFFF').borderRadius(6)
                        .margin({ left: 8 })
                        .onClick(() => {
                          if (this.commentText.trim() !== '') {
                            this.dataManager.addComment(item.id, this.commentText)
                            this.momentsList = this.deepCopyList()
                            this.commentText = ''
                            this.commentMomentId = -1
                          }
                        })
                    }.width('100%').margin({ top: 8 })
                  }
                }.layoutWeight(1).alignItems(HorizontalAlign.Start)
              }.width('100%').padding(16).alignItems(VerticalAlign.Top)
              Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')
            }.width('100%').backgroundColor('#FFFFFF')
          }
        }, (item: MomentItem) => item.id.toString() + '_' + item.liked.toString() + '_' + item.comments.length.toString())
      }.layoutWeight(1).backgroundColor('#EDEDED')
    }.width('100%').height('100%').justifyContent(FlexAlign.Start).alignItems(HorizontalAlign.Start)
  }
}
