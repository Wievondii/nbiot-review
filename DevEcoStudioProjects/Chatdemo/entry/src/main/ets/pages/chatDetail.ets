import { DataManager, MessageItem } from '../util/DataManager';
import router from '@ohos.router';
@Entry
@Component
struct ChatDetail {
  @State chatId: number = 0
  @State chatName: string = ''
  @State messageInput: string = ''
  @State messageList: MessageItem[] = []
  @State showMore: boolean = false
  private dataManager: DataManager = DataManager.getInstance()
  private scroller: Scroller = new Scroller()
  private autoReplies: string[] = ['好的，我知道了', '没问题', '收到，谢谢', '嗯嗯', '好的好的', '可以啊']
  aboutToAppear() {
    const params = router.getParams() as Record<string, string | number> | undefined
    this.chatId = params?.chatId as number ?? 0
    this.chatName = params?.chatName as string ?? ''
    if (this.chatId) {
      this.messageList = this.dataManager.getMessages(this.chatId)
    }
  }
  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('#07C160').margin({ right: 8 }).onClick(() => { router.back() })
        Text(this.chatName).fontSize(18).fontWeight(FontWeight.Bold).fontColor('#000000')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#EDEDED')
      List({ scroller: this.scroller }) {
        ForEach(this.messageList, (item: MessageItem) => {
          ListItem() {
            Row() {
              if (!item.isSelf) {
                Image($r('app.media.' + this.dataManager.getAvatar(item.avatarIndex))).width(40).height(40).borderRadius(6).margin({ right: 10 })
              }
              Text(item.content).fontSize(16).padding({ left: 12, right: 12, top: 10, bottom: 10 })
                .constraintSize({ maxWidth: '70%' }).backgroundColor(item.isSelf ? '#95EC69' : '#FFFFFF').borderRadius(6).fontColor('#000000')
              if (item.isSelf) {
                Image($r('app.media.headImage')).width(40).height(40).borderRadius(6).margin({ left: 10 })
              }
            }.width('100%').justifyContent(item.isSelf ? FlexAlign.End : FlexAlign.Start)
          }
        }, (item: MessageItem) => item.id.toString())
      }.layoutWeight(1).divider({ strokeWidth: 0 }).backgroundColor('#EDEDED')
      Row() {
        TextInput({ text: this.messageInput, placeholder: '输入消息...' }).layoutWeight(1).height(36).fontSize(16).backgroundColor('#FFFFFF').borderRadius(6)
          .onChange((value: string) => { this.messageInput = value })
        Button('发送').width(60).height(36).margin({ left: 10 }).backgroundColor('#07C160').fontColor('#FFFFFF').borderRadius(6)
          .onClick(() => {
            if (this.messageInput.trim() !== '') {
              this.dataManager.addMessage(this.chatId, { id: this.messageList.length + 1, content: this.messageInput, time: new Date().toLocaleTimeString().substring(0, 5), isSelf: true, avatarIndex: -1 })
              this.messageList = this.dataManager.getMessages(this.chatId)
              this.messageInput = ''
              const cid = this.chatId
              setTimeout(() => {
                const reply = this.autoReplies[Math.floor(Math.random() * this.autoReplies.length)]
                this.dataManager.addMessage(cid, { id: this.messageList.length + 1, content: reply, time: new Date().toLocaleTimeString().substring(0, 5), isSelf: false, avatarIndex: cid % 3 })
                this.messageList = this.dataManager.getMessages(cid)
                this.scroller.scrollEdge(Edge.Bottom)
              }, 1000)
            }
          })
      }.width('100%').height(50).padding({ left: 12, right: 12 }).backgroundColor('#F5F5F5').alignItems(VerticalAlign.Center)
    }.width('100%').height('100%').backgroundColor('#EDEDED')
  }
}