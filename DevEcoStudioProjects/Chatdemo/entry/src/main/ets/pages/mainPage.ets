import { DataManager, ChatItem, ContactItem } from '../util/DataManager';
import router from '@ohos.router';

@Component
struct ChatTabComponent {
  @Link selectIndex: number
  @Link chatList: ChatItem[]
  @Link totalUnread: number
  private dataManager: DataManager = DataManager.getInstance()

  build() {
    Column() {
      Row() {
        Text('微信').fontSize(20).fontWeight(FontWeight.Bold).fontColor('#000000')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')

      Scroll() {
        Column() {
          ForEach(this.chatList, (item: ChatItem) => {
            Row() {
              Image($r('app.media.' + this.dataManager.getAvatar(item.avatarIndex)))
                .width(48).height(48).borderRadius(6).margin({ right: 12 })
              Column() {
                Row() {
                  Text(item.name).fontSize(16).fontColor('#000000')
                  Blank()
                  Text(item.time).fontSize(12).fontColor('#B0B0B0')
                }.width('100%')
                Row() {
                  Text(item.lastMessage).fontSize(13).fontColor('#999999').maxLines(1)
                    .textOverflow({ overflow: TextOverflow.Ellipsis }).layoutWeight(1)
                  if (item.unreadCount > 0) {
                    Text(item.unreadCount > 99 ? '99+' : item.unreadCount.toString())
                      .fontSize(11).fontColor('#FFFFFF').backgroundColor('#FF0000')
                      .borderRadius(10).constraintSize({ minWidth: 18 }).height(18)
                      .textAlign(TextAlign.Center).padding({ left: 5, right: 5 }).margin({ left: 8 })
                  }
                }.width('100%').margin({ top: 4 })
              }.layoutWeight(1)
            }
            .width('100%')
            .height(68)
            .padding({ left: 16, right: 16 })
            .backgroundColor('#FFFFFF')
            .onClick(() => {
              this.dataManager.clearUnread(item.id)
              this.chatList = this.dataManager.getChatList().slice()
              this.totalUnread = this.dataManager.getTotalUnread()
              router.pushUrl({ url: 'pages/chatDetail', params: { chatId: item.id, chatName: item.name } })
            })

            Divider().strokeWidth(0.5).color('#F0F0F0')
          }, (item: ChatItem) => item.id.toString())
        }.width('100%')
      }.layoutWeight(1).backgroundColor('#EDEDED')
    }.width('100%').height('100%').backgroundColor('#EDEDED')
  }
}

@Component
struct ContactTabComponent {
  @Link contactList: ContactItem[]
  private dataManager: DataManager = DataManager.getInstance()

  build() {
    Column() {
      Row() {
        Text('通讯录').fontSize(20).fontWeight(FontWeight.Bold).fontColor('#000000')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')

      Scroll() {
        Column() {
          Row() {
            Text('👤').fontSize(20).width(36).height(36).textAlign(TextAlign.Center).backgroundColor('#FDCB6E').borderRadius(6).margin({ right: 12 })
            Text('新的朋友').fontSize(16).fontColor('#000000')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/newFriendPage' }) })

          Divider().strokeWidth(0.5).color('#F0F0F0')

          Row() {
            Text('👥').fontSize(20).width(36).height(36).textAlign(TextAlign.Center).backgroundColor('#6CC1F5').borderRadius(6).margin({ right: 12 })
            Text('群聊').fontSize(16).fontColor('#000000')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/groupChatPage' }) })

          Divider().strokeWidth(0.5).color('#F0F0F0')

          Row() {
            Text('🏷️').fontSize(20).width(36).height(36).textAlign(TextAlign.Center).backgroundColor('#F5A623').borderRadius(6).margin({ right: 12 })
            Text('标签').fontSize(16).fontColor('#000000')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/tagPage' }) })

          Divider().strokeWidth(0.5).color('#F0F0F0')

          Row() {
            Text('📢').fontSize(20).width(36).height(36).textAlign(TextAlign.Center).backgroundColor('#7B68EE').borderRadius(6).margin({ right: 12 })
            Text('公众号').fontSize(16).fontColor('#000000')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/officialAccountsPage' }) })

          Column() {}.width('100%').height(8).backgroundColor('#EDEDED')

          ForEach(this.contactList, (item: ContactItem) => {
            Row() {
              Image($r('app.media.' + this.dataManager.getAvatar(item.avatarIndex)))
                .width(40).height(40).borderRadius(6).margin({ right: 12 })
              Text(item.name).fontSize(16).fontColor('#000000')
            }
            .width('100%')
            .height(56)
            .padding({ left: 16, right: 16 })
            .backgroundColor('#FFFFFF')
            .onClick(() => { router.pushUrl({ url: 'pages/contactDetailPage', params: { contactName: item.name } }) })

            Divider().strokeWidth(0.5).color('#F0F0F0')
          }, (item: ContactItem) => item.id.toString())
        }.width('100%')
      }.layoutWeight(1).backgroundColor('#EDEDED')
    }.width('100%').height('100%').backgroundColor('#EDEDED')
  }
}

@Component
struct DiscoverTabComponent {
  build() {
    Column() {
      Row() {
        Text('发现').fontSize(20).fontWeight(FontWeight.Bold).fontColor('#000000')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')

      Scroll() {
        Column() {
          Row() {
            Text('🌐').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('朋友圈').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/momentsPage' }) })

          Column() {}.width('100%').height(8).backgroundColor('#EDEDED')

          Row() {
            Text('📷').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('扫一扫').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/scanPage' }) })

          Divider().strokeWidth(0.5).color('#F0F0F0')

          Row() {
            Text('📱').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('摇一摇').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/shakePage' }) })

          Column() {}.width('100%').height(8).backgroundColor('#EDEDED')

          Row() {
            Text('👁️').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('看一看').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/lookPage' }) })

          Divider().strokeWidth(0.5).color('#F0F0F0')

          Row() {
            Text('🔍').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('搜一搜').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/searchPage' }) })

          Column() {}.width('100%').height(8).backgroundColor('#EDEDED')

          Row() {
            Text('📍').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('附近的人').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/nearbyPage' }) })

          Column() {}.width('100%').height(8).backgroundColor('#EDEDED')

          Row() {
            Text('🛒').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('购物').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/shoppingPage' }) })

          Divider().strokeWidth(0.5).color('#F0F0F0')

          Row() {
            Text('🎮').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('游戏').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/gamePage' }) })

          Column() {}.width('100%').height(8).backgroundColor('#EDEDED')

          Row() {
            Text('Ⓜ️').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('小程序').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/miniProgramPage' }) })

          Divider().strokeWidth(0.5).color('#F0F0F0')

          Row() {
            Text('📺').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('视频号').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/videoChannelPage' }) })
        }.width('100%')
      }.layoutWeight(1).backgroundColor('#EDEDED')
    }.width('100%').height('100%').backgroundColor('#EDEDED')
  }
}

@Component
struct MineTabComponent {
  build() {
    Column() {
      Row() {
        Text('我').fontSize(20).fontWeight(FontWeight.Bold).fontColor('#000000')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')

      Scroll() {
        Column() {
          Row() {
            Image($r('app.media.headImage')).width(64).height(64).borderRadius(8).margin({ right: 16 })
            Column() {
              Text('微信用户').fontSize(20).fontWeight(FontWeight.Bold).fontColor('#000000')
              Text('微信号：wxid_abc123').fontSize(14).fontColor('#999999').margin({ top: 6 })
            }.alignItems(HorizontalAlign.Start)
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(100).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/profilePage' }) })

          Column() {}.width('100%').height(8).backgroundColor('#EDEDED')

          Row() {
            Text('💳').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('服务').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/servicePage' }) })

          Divider().strokeWidth(0.5).color('#F0F0F0')

          Row() {
            Text('⭐').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('收藏').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/favoritesPage' }) })

          Divider().strokeWidth(0.5).color('#F0F0F0')

          Row() {
            Text('📷').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('朋友圈').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/momentsPage' }) })

          Divider().strokeWidth(0.5).color('#F0F0F0')

          Row() {
            Text('🃏').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('卡包').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/cardPackPage' }) })

          Divider().strokeWidth(0.5).color('#F0F0F0')

          Row() {
            Text('😊').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('表情').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/emojiPage' }) })

          Column() {}.width('100%').height(8).backgroundColor('#EDEDED')

          Row() {
            Text('⚙️').fontSize(20).width(28).height(28).textAlign(TextAlign.Center).margin({ right: 12 })
            Text('设置').fontSize(16).fontColor('#000000')
            Blank()
            Text('>').fontSize(16).fontColor('#CCCCCC')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/settingsPage' }) })
        }.width('100%')
      }.layoutWeight(1).backgroundColor('#EDEDED')
    }.width('100%').height('100%').backgroundColor('#EDEDED')
  }
}

@Entry
@Component
struct MainPage {
  @State selectIndex: number = 0
  @State chatList: ChatItem[] = []
  @State contactList: ContactItem[] = []
  @State totalUnread: number = 0
  private dataManager: DataManager = DataManager.getInstance()

  aboutToAppear() {
    this.chatList = this.dataManager.getChatList()
    this.contactList = this.dataManager.getContactList()
    this.totalUnread = this.dataManager.getTotalUnread()
  }

  @Builder
  tabBuilder(title: string, targetIndex: number, selectedImg: Resource, normalImg: Resource) {
    Column() {
      Stack({ alignContent: Alignment.TopEnd }) {
        Image(this.selectIndex === targetIndex ? selectedImg : normalImg).size({ width: 25, height: 25 })
        if (targetIndex === 0 && this.totalUnread > 0) {
          Text(this.totalUnread > 99 ? '99+' : this.totalUnread.toString())
            .fontSize(10).fontColor('#FFFFFF').backgroundColor('#FF0000').borderRadius(8)
            .padding({ left: 4, right: 4, top: 1, bottom: 1 }).offset({ x: 8, y: -5 })
        }
      }.width(30).height(30)
      Text(title).fontColor(this.selectIndex === targetIndex ? '#07C160' : '#6B6B6B').fontSize(11).margin({ top: 2 })
    }.width('100%').height(50).justifyContent(FlexAlign.Center)
  }

  build() {
    Tabs({ barPosition: BarPosition.End, index: this.selectIndex }) {
      TabContent() { ChatTabComponent({ selectIndex: $selectIndex, chatList: $chatList, totalUnread: $totalUnread }) }.tabBar(this.tabBuilder('微信', 0, $r('app.media.p12'), $r('app.media.p11')))
      TabContent() { ContactTabComponent({ contactList: $contactList }) }.tabBar(this.tabBuilder('通讯录', 1, $r('app.media.p22'), $r('app.media.p21')))
      TabContent() { DiscoverTabComponent() }.tabBar(this.tabBuilder('发现', 2, $r('app.media.p32'), $r('app.media.p31')))
      TabContent() { MineTabComponent() }.tabBar(this.tabBuilder('我', 3, $r('app.media.p42'), $r('app.media.p41')))
    }.onChange((index: number) => { this.selectIndex = index })
  }
}
