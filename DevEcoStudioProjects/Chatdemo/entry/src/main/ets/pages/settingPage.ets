/**
 * @deprecated 此文件已废弃，请使用 settingsPage.ets
 * 原因：与 settingsPage.ets 功能重复，导航关系表使用 settingsPage
 */
import { DataManager } from '../util/DataManager';
import router from '@ohos.router';

@Entry
@Component
struct SettingPage {
  @State showChangePwd: boolean = false
  @State oldPwd: string = ''
  @State newPwd: string = ''
  @State confirmPwd: string = ''
  private dataManager: DataManager = DataManager.getInstance()

  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('#000000').margin({ right: 16 })
          .onClick(() => { router.back() })
        Text('设置').fontSize(18).fontWeight(FontWeight.Bold).fontColor('#000000')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')

      if (this.showChangePwd) {
        Column() {
          Text('修改密码').fontSize(18).fontWeight(FontWeight.Bold).fontColor('#000000')
            .width('100%').textAlign(TextAlign.Center).margin({ top: 20, bottom: 20 })

          Row() {
            Text('原密码').fontSize(16).fontColor('#000000').width(80)
            TextInput({ placeholder: '请输入原密码' }).type(InputType.Password)
              .layoutWeight(1).height(44).fontSize(16)
              .onChange((val: string) => { this.oldPwd = val })
          }.width('90%').height(44).alignItems(VerticalAlign.Center)
          Divider().strokeWidth(0.5).width('90%')

          Row() {
            Text('新密码').fontSize(16).fontColor('#000000').width(80)
            TextInput({ placeholder: '请输入新密码' }).type(InputType.Password)
              .layoutWeight(1).height(44).fontSize(16)
              .onChange((val: string) => { this.newPwd = val })
          }.width('90%').height(44).margin({ top: 16 }).alignItems(VerticalAlign.Center)
          Divider().strokeWidth(0.5).width('90%')

          Row() {
            Text('确认密码').fontSize(16).fontColor('#000000').width(80)
            TextInput({ placeholder: '请再次输入新密码' }).type(InputType.Password)
              .layoutWeight(1).height(44).fontSize(16)
              .onChange((val: string) => { this.confirmPwd = val })
          }.width('90%').height(44).margin({ top: 16 }).alignItems(VerticalAlign.Center)
          Divider().strokeWidth(0.5).width('90%')

          Button('确认修改')
            .width('85%').height(48).margin({ top: 30 })
            .fontSize(16).fontColor('#FFFFFF').backgroundColor('#07C160')
            .borderRadius(8)
            .onClick(() => {
              if (this.oldPwd !== this.dataManager.getUserPassword()) {
                this.getUIContext().getPromptAction().showToast({ message: '原密码错误', duration: 2000 })
              } else if (this.newPwd.length < 6) {
                this.getUIContext().getPromptAction().showToast({ message: '新密码至少6位', duration: 2000 })
              } else if (this.newPwd !== this.confirmPwd) {
                this.getUIContext().getPromptAction().showToast({ message: '两次密码不一致', duration: 2000 })
              } else {
                this.dataManager.changePassword(this.newPwd)
                this.getUIContext().getPromptAction().showToast({ message: '密码修改成功', duration: 2000 })
                this.showChangePwd = false
                this.oldPwd = ''
                this.newPwd = ''
                this.confirmPwd = ''
              }
            })

          Button('取消')
            .width('85%').height(48).margin({ top: 10 })
            .fontSize(16).fontColor('#666666').backgroundColor('#F5F5F5')
            .borderRadius(8)
            .onClick(() => {
              this.showChangePwd = false
              this.oldPwd = ''
              this.newPwd = ''
              this.confirmPwd = ''
            })
        }.width('100%').height('100%').backgroundColor('#FFFFFF')
      } else {
        List() {
          ListItem() {
            Row() {
              Image($r('app.media.headImage')).width(64).height(64).borderRadius(8).margin({ right: 16 })
              Column() {
                Text('微信用户').fontSize(18).fontWeight(FontWeight.Bold).fontColor('#000000')
                Text('微信号：wxid_abc123').fontSize(14).fontColor('#999999').margin({ top: 4 })
              }.alignItems(HorizontalAlign.Start)
              Blank()
              Text(' >').fontSize(16).fontColor('#CCCCCC')
            }.width('100%').height(100).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          }
          ListItem() { Column() {}.width('100%').height(8).backgroundColor('#EDEDED') }

          ListItem() {
            Row() {
              Text('账号与安全').fontSize(16).fontColor('#000000')
              Blank()
              Text(' >').fontSize(16).fontColor('#CCCCCC')
            }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          }
          ListItem() { Column() {}.width('100%').height(8).backgroundColor('#EDEDED') }

          ListItem() {
            Row() {
              Text('新消息通知').fontSize(16).fontColor('#000000')
              Blank()
              Text(' >').fontSize(16).fontColor('#CCCCCC')
            }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          }
          ListItem() {
            Row() {
              Text('隐私').fontSize(16).fontColor('#000000')
              Blank()
              Text(' >').fontSize(16).fontColor('#CCCCCC')
            }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          }
          ListItem() {
            Row() {
              Text('通用').fontSize(16).fontColor('#000000')
              Blank()
              Text(' >').fontSize(16).fontColor('#CCCCCC')
            }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          }
          ListItem() { Column() {}.width('100%').height(8).backgroundColor('#EDEDED') }

          ListItem() {
            Row() {
              Text('关于微信').fontSize(16).fontColor('#000000')
              Blank()
              Text(' >').fontSize(16).fontColor('#CCCCCC')
            }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          }
          ListItem() { Column() {}.width('100%').height(8).backgroundColor('#EDEDED') }

          ListItem() {
            Row() {
              Text('修改密码').fontSize(16).fontColor('#000000')
              Blank()
              Text(' >').fontSize(16).fontColor('#CCCCCC')
            }.width('100%').height(56).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
            .onClick(() => { this.showChangePwd = true })
          }
          ListItem() { Column() {}.width('100%').height(8).backgroundColor('#EDEDED') }

          ListItem() {
            Button('退出登录')
              .width('90%').height(48).margin({ left: '5%', top: 20 })
              .fontSize(16).fontColor('#FF0000').backgroundColor('#FFFFFF')
              .borderRadius(8).borderWidth(1).borderColor('#FF0000')
              .onClick(() => {
                router.pushUrl({ url: 'pages/login' })
              })
          }
        }.layoutWeight(1).divider({ strokeWidth: 0 }).margin({ top: 8 })
      }
    }.width('100%').height('100%').backgroundColor('#EDEDED')
  }
}