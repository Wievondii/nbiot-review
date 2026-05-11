import { DataManager, ChatItem, ContactItem } from '../util/DataManager';
import router from '@ohos.router';

@Component
struct ChatTabComponent {
  @Link selectIndex: number
  @Link chatList: ChatItem[]
  @Link totalUnread: number
  @State searchText: string = ''
  @State showSearch: boolean = false
  @State showMenu: boolean = false
  private dataManager: DataManager = DataManager.getInstance()

  build() {
    Stack({ alignContent: Alignment.TopEnd }) {
      Column() {
        Row() {
          if (this.showSearch) {
            TextInput({ placeholder: '搜索' }).layoutWeight(1).height(34).fontSize(14).borderRadius(6).backgroundColor('#F5F5F5')
              .onChange((val: string) => { this.searchText = val })
            Text('取消').fontSize(14).fontColor('#07C160').margin({ left: 8 })
              .onClick(() => { this.showSearch = false; this.searchText = '' })
          } else {
            Text('微信').fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
            Blank()
            Text('🔍').fontSize(18).margin({ right: 16 }).onClick(() => { this.showSearch = true })
            Text('＋').fontSize(22).fontColor('rgba(0, 0, 0, 0.9)')
              .onClick(() => { this.showMenu = !this.showMenu })
          }
        }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')

        Scroll() {
          Column() {
            ForEach(this.chatList, (item: ChatItem) => {
              if (this.searchText === '' || item.name.indexOf(this.searchText) >= 0) {
                Row() {
                  Image($r('app.media.' + this.dataManager.getAvatar(item.avatarIndex)))
                    .width(48).height(48).borderRadius(6).margin({ right: 12 })
                  Column() {
                    Row() {
                      Text(item.name).fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
                      Blank()
                      Text(item.time).fontSize(12).fontColor('rgba(0, 0, 0, 0.3)')
                    }.width('100%')
                    Row() {
                      Text(item.lastMessage).fontSize(14).fontColor('rgba(0, 0, 0, 0.55)').maxLines(1)
                        .textOverflow({ overflow: TextOverflow.Ellipsis }).layoutWeight(1)
                      if (item.unreadCount > 0) {
                        Text(item.unreadCount > 99 ? '99+' : item.unreadCount.toString())
                          .fontSize(11).fontColor('#FFFFFF').backgroundColor('#FA5151')
                          .borderRadius(10).constraintSize({ minWidth: 18 }).height(18)
                          .textAlign(TextAlign.Center).padding({ left: 5, right: 5 }).margin({ left: 8 })
                      }
                    }.width('100%').margin({ top: 4 })
                  }.layoutWeight(1)
                }
                .width('100%').height(68).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
                .onClick(() => {
                  this.dataManager.clearUnread(item.id)
                  this.chatList = this.dataManager.getChatList().slice()
                  this.totalUnread = this.dataManager.getTotalUnread()
                  router.pushUrl({ url: 'pages/chatDetail', params: { chatId: item.id, chatName: item.name } })
                })
                Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')
              }
            }, (item: ChatItem) => item.id.toString() + '_' + item.lastMessage + '_' + item.unreadCount.toString())
          }.width('100%')
        }.layoutWeight(1).backgroundColor('#EDEDED')
      }.width('100%').height('100%').justifyContent(FlexAlign.Start)

      if (this.showMenu) {
        Column() {
          Column() {
            Row() { Text('💬').fontSize(18).margin({ right: 10 }); Text('发起群聊').fontSize(15).fontColor('rgba(0, 0, 0, 0.9)') }.width('100%').height(44).padding({ left: 16, right: 16 }).alignItems(VerticalAlign.Center)
              .onClick(() => { this.showMenu = false; this.getUIContext().getPromptAction().showToast({ message: '发起群聊', duration: 1500 }) })
            Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')
            Row() { Text('👤').fontSize(18).margin({ right: 10 }); Text('添加朋友').fontSize(15).fontColor('rgba(0, 0, 0, 0.9)') }.width('100%').height(44).padding({ left: 16, right: 16 }).alignItems(VerticalAlign.Center)
              .onClick(() => { this.showMenu = false; router.pushUrl({ url: 'pages/newFriendPage' }) })
            Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')
            Row() { Text('📷').fontSize(18).margin({ right: 10 }); Text('扫一扫').fontSize(15).fontColor('rgba(0, 0, 0, 0.9)') }.width('100%').height(44).padding({ left: 16, right: 16 }).alignItems(VerticalAlign.Center)
              .onClick(() => { this.showMenu = false; router.pushUrl({ url: 'pages/scanPage' }) })
            Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')
            Row() { Text('💰').fontSize(18).margin({ right: 10 }); Text('收付款').fontSize(15).fontColor('rgba(0, 0, 0, 0.9)') }.width('100%').height(44).padding({ left: 16, right: 16 }).alignItems(VerticalAlign.Center)
              .onClick(() => { this.showMenu = false; router.pushUrl({ url: 'pages/wechatPayPage' }) })
          }.width(160).backgroundColor('#4C4C4C').borderRadius(6)
        }.width('100%').height('100%').backgroundColor('#00000040')
        .onClick(() => { this.showMenu = false })
      }
    }.width('100%').height('100%')
  }
}

@Component
struct ContactTabComponent {
  @Link contactList: ContactItem[]
  private dataManager: DataManager = DataManager.getInstance()

  build() {
    Column() {
      Row() {
        Text('通讯录').fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')

      Scroll() {
        Column() {
          Row() {
            Text('👤').fontSize(20).width(36).height(36).textAlign(TextAlign.Center).backgroundColor('#FDCB6E').borderRadius(6).margin({ right: 12 })
            Text('新的朋友').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/newFriendPage' }) })
          Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')

          Row() {
            Text('👥').fontSize(20).width(36).height(36).textAlign(TextAlign.Center).backgroundColor('#6CC1F5').borderRadius(6).margin({ right: 12 })
            Text('群聊').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/groupChatPage' }) })
          Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')

          Row() {
            Text('🏷️').fontSize(20).width(36).height(36).textAlign(TextAlign.Center).backgroundColor('#F5A623').borderRadius(6).margin({ right: 12 })
            Text('标签').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/tagPage' }) })
          Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')

          Row() {
            Text('📢').fontSize(20).width(36).height(36).textAlign(TextAlign.Center).backgroundColor('#7B68EE').borderRadius(6).margin({ right: 12 })
            Text('公众号').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
          }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/officialAccountsPage' }) })

          Column() {}.width('100%').height(8).backgroundColor('#EDEDED')

          ForEach(this.contactList, (item: ContactItem) => {
            Row() {
              Image($r('app.media.' + this.dataManager.getAvatar(item.avatarIndex)))
                .width(40).height(40).borderRadius(6).margin({ right: 12 })
              Text(item.name).fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
            }
            .width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
            .onClick(() => { router.pushUrl({ url: 'pages/contactDetailPage', params: { contactName: item.name } }) })
            Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')
          }, (item: ContactItem) => item.id.toString())
        }.width('100%')
      }.layoutWeight(1).backgroundColor('#EDEDED')
    }.width('100%').height('100%').backgroundColor('#EDEDED').justifyContent(FlexAlign.Start)
  }
}

@Component
struct DiscoverTabComponent {
  build() {
    Column() {
      Scroll() {
        Column() {
          Row() {
            Text('朋友圈').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
            Blank()
            Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
          }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/momentsPage' }) })

          Column() {}.width('100%').height(10).backgroundColor('#EDEDED')

          Row() {
            Text('扫一扫').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
            Blank()
            Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
          }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/scanPage' }) })
          Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)').margin({ left: 16 })

          Row() {
            Text('摇一摇').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
            Blank()
            Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
          }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/shakePage' }) })

          Column() {}.width('100%').height(10).backgroundColor('#EDEDED')

          Row() {
            Text('看一看').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
            Blank()
            Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
          }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/lookPage' }) })
          Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)').margin({ left: 16 })

          Row() {
            Text('搜一搜').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
            Blank()
            Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
          }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/searchPage' }) })

          Column() {}.width('100%').height(10).backgroundColor('#EDEDED')

          Row() {
            Text('附近的人').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
            Blank()
            Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
          }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/nearbyPage' }) })

          Column() {}.width('100%').height(10).backgroundColor('#EDEDED')

          Row() {
            Text('购物').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
            Blank()
            Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
          }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/shoppingPage' }) })
          Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)').margin({ left: 16 })

          Row() {
            Text('游戏').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
            Blank()
            Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
          }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/gamePage' }) })

          Column() {}.width('100%').height(10).backgroundColor('#EDEDED')

          Row() {
            Text('小程序').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
            Blank()
            Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
          }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/miniProgramPage' }) })
          Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)').margin({ left: 16 })

          Row() {
            Text('视频号').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
            Blank()
            Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
          }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/videoChannelPage' }) })
        }.width('100%')
      }.layoutWeight(1).backgroundColor('#EDEDED')
    }.width('100%').height('100%').backgroundColor('#EDEDED').justifyContent(FlexAlign.Start)
  }
}

@Component
struct MineTabComponent {
  build() {
    Column() {
      Scroll() {
        Column() {
          Row() {
            Image($r('app.media.headImage')).width(60).height(60).borderRadius(8).margin({ right: 12 })
            Column() {
              Text('泡泡').fontSize(20).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
              Row() {
                Text('微信号：wxid_abc123').fontSize(13).fontColor('rgba(0, 0, 0, 0.55)')
              }.margin({ top: 6 })
            }.alignItems(HorizontalAlign.Start)
            Blank()
            Column() {
              Text('📱').fontSize(20).margin({ bottom: 8 })
              Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
            }.alignItems(HorizontalAlign.Center)
          }.width('100%').height(100).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/profilePage' }) })

          Column() {}.width('100%').height(10).backgroundColor('#EDEDED')

          Row() { Text('服务').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)'); Blank(); Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)') }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/servicePage' }) })

          Column() {}.width('100%').height(10).backgroundColor('#EDEDED')

          Row() { Text('朋友圈').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)'); Blank(); Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)') }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/momentsPage' }) })
          Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)').margin({ left: 16 })

          Row() { Text('收藏').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)'); Blank(); Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)') }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/favoritesPage' }) })
          Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)').margin({ left: 16 })

          Row() { Text('卡包').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)'); Blank(); Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)') }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/cardPackPage' }) })
          Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)').margin({ left: 16 })

          Row() { Text('表情').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)'); Blank(); Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)') }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/emojiPage' }) })

          Column() {}.width('100%').height(10).backgroundColor('#EDEDED')

          Row() { Text('设置').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)'); Blank(); Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)') }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/settingsPage' }) })
        }.width('100%')
      }.layoutWeight(1).backgroundColor('#EDEDED')
    }.width('100%').height('100%').backgroundColor('#EDEDED').justifyContent(FlexAlign.Start)
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
    this.chatList = this.dataManager.getChatList().slice()
    this.contactList = this.dataManager.getContactList()
    this.totalUnread = this.dataManager.getTotalUnread()
  }

  onPageShow() {
    this.chatList = this.dataManager.getChatList().slice()
    this.totalUnread = this.dataManager.getTotalUnread()
  }

  @Builder
  tabBuilder(title: string, targetIndex: number, selectedImg: Resource, normalImg: Resource) {
    Column() {
      Stack({ alignContent: Alignment.TopEnd }) {
        Image(this.selectIndex === targetIndex ? selectedImg : normalImg).size({ width: 25, height: 25 })
        if (targetIndex === 0 && this.totalUnread > 0) {
          Text(this.totalUnread > 99 ? '99+' : this.totalUnread.toString())
            .fontSize(11).fontColor('#FFFFFF').backgroundColor('#FA5151').borderRadius(8)
            .padding({ left: 4, right: 4, top: 1, bottom: 1 }).offset({ x: 8, y: -5 })
        }
      }.width(30).height(30)
      Text(title).fontColor(this.selectIndex === targetIndex ? '#07C160' : 'rgba(0, 0, 0, 0.55)').fontSize(11).margin({ top: 2 })
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
