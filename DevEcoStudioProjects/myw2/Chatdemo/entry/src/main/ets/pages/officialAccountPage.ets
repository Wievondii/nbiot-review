import router from '@ohos.router'
import { DataManager, OfficialAccountItem } from '../util/DataManager'

@Entry
@Component
struct OfficialAccountPage {
  private dataManager: DataManager = DataManager.getInstance()
  @State accounts: OfficialAccountItem[] = []
  @State showArticles: boolean = false
  @State selectedAccount: OfficialAccountItem = { id: 0, name: '', desc: '', avatarIndex: 0, followed: false }
  @State articles: string[] = ['最新文章：功能更新说明', '使用技巧分享', '常见问题解答']

  aboutToAppear() {
    this.accounts = this.dataManager.getOfficialAccounts()
  }

  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('rgba(0, 0, 0, 0.9)').margin({ right: 16 })
          .onClick(() => {
            if (this.showArticles) {
              this.showArticles = false
            } else {
              router.back()
            }
          })
        Text(this.showArticles ? this.selectedAccount.name : '公众号').fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
        Blank()
        if (!this.showArticles) {
          Text('+').fontSize(22).fontColor('rgba(0, 0, 0, 0.9)')
            .onClick(() => {
              this.getUIContext().getPromptAction().showToast({ message: '搜索公众号', duration: 1500 })
            })
        }
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')

      if (this.showArticles) {
        this.articleListBuilder()
      } else {
        this.accountListBuilder()
      }
    }.width('100%').height('100%').backgroundColor('#EDEDED').justifyContent(FlexAlign.Start).alignItems(HorizontalAlign.Start)
  }

  @Builder
  accountListBuilder() {
    List() {
      ForEach(this.accounts, (account: OfficialAccountItem) => {
        ListItem() {
          Row() {
            Column() {
              Text(account.name.length > 0 ? account.name.substring(0, 1) : '?')
                .fontSize(20).fontColor('#FFFFFF')
            }
            .width(44).height(44).borderRadius(6).backgroundColor('#7B68EE')
            .justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center).margin({ right: 12 })

            Column() {
              Text(account.name).fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
              Text(account.desc).fontSize(13).fontColor('rgba(0, 0, 0, 0.55)').margin({ top: 4 })
                .maxLines(1).textOverflow({ overflow: TextOverflow.Ellipsis })
            }.alignItems(HorizontalAlign.Start).layoutWeight(1)

            Text(account.followed ? '已关注' : '关注')
              .fontSize(13)
              .fontColor(account.followed ? 'rgba(0, 0, 0, 0.55)' : '#07C160')
              .padding({ left: 12, right: 12, top: 4, bottom: 4 })
              .borderRadius(4)
              .borderWidth(account.followed ? 0 : 1)
              .borderColor('#07C160')
              .onClick(() => {
                this.dataManager.toggleFollowAccount(account.id)
                this.accounts = this.dataManager.getOfficialAccounts()
                this.getUIContext().getPromptAction().showToast({
                  message: account.followed ? '已取消关注' : '已关注',
                  duration: 1500
                })
              })
          }.width('100%').height(68).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
        }.onClick(() => {
          this.selectedAccount = account
          this.showArticles = true
        })
      })
    }.layoutWeight(1).divider({ strokeWidth: 0.5, color: 'rgba(0, 0, 0, 0.1)' })
  }

  @Builder
  articleListBuilder() {
    Column() {
      Column() {
        Column() {
          Text(this.selectedAccount.name.length > 0 ? this.selectedAccount.name.substring(0, 1) : '?')
            .fontSize(32).fontColor('#FFFFFF')
        }
        .width(64).height(64).borderRadius(8).backgroundColor('#7B68EE')
        .justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center).margin({ bottom: 12 })

        Text(this.selectedAccount.name).fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
        Text(this.selectedAccount.desc).fontSize(13).fontColor('rgba(0, 0, 0, 0.55)').margin({ top: 6 })
          .maxLines(2).textOverflow({ overflow: TextOverflow.Ellipsis })

        Row() {
          Button(this.selectedAccount.followed ? '已关注' : '关注')
            .fontSize(14).fontColor(this.selectedAccount.followed ? 'rgba(0, 0, 0, 0.55)' : '#FFFFFF')
            .height(36).borderRadius(18)
            .backgroundColor(this.selectedAccount.followed ? '#F5F5F5' : '#07C160')
            .onClick(() => {
              this.dataManager.toggleFollowAccount(this.selectedAccount.id)
              this.accounts = this.dataManager.getOfficialAccounts()
              this.selectedAccount.followed = !this.selectedAccount.followed
              this.getUIContext().getPromptAction().showToast({
                message: this.selectedAccount.followed ? '已关注' : '已取消关注',
                duration: 1500
              })
            })
        }.margin({ top: 16 })
      }.width('100%').padding(20).alignItems(HorizontalAlign.Center).backgroundColor('#FFFFFF')

      Column() {}.width('100%').height(8).backgroundColor('#EDEDED')

      List() {
        ListItem() {
          Text('最近文章')
            .fontSize(14).fontColor('rgba(0, 0, 0, 0.55)')
            .padding({ left: 16, top: 12, bottom: 8 })
        }

        ForEach(this.articles, (article: string) => {
          ListItem() {
            Row() {
              Column() {
                Text(article).fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
                Text('2026-05-10').fontSize(12).fontColor('rgba(0, 0, 0, 0.3)').margin({ top: 6 })
              }.alignItems(HorizontalAlign.Start).layoutWeight(1)
              Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
            }.width('100%').padding({ left: 16, right: 16, top: 12, bottom: 12 }).backgroundColor('#FFFFFF')
          }.onClick(() => {
            this.getUIContext().getPromptAction().showToast({ message: '打开文章: ' + article, duration: 1500 })
          })
        })
      }.layoutWeight(1).divider({ strokeWidth: 0.5, color: 'rgba(0, 0, 0, 0.1)' })
    }.width('100%').height('100%').backgroundColor('#EDEDED').justifyContent(FlexAlign.Start)
  }
}
