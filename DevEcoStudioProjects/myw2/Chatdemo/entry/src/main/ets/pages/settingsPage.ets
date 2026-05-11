import router from '@ohos.router';
@Entry
@Component
struct SettingsPage {
  @State showDialog: boolean = false
  @State oldPwd: string = ''
  @State newPwd: string = ''
  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('rgba(0, 0, 0, 0.9)').margin({ right: 16 }).onClick(() => { router.back() })
        Text('设置').fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
      Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')
      Scroll() {
        Column() {
          // 个人信息
          Row() {
            Image($r('app.media.headImage')).width(56).height(56).borderRadius(6).margin({ right: 12 })
            Column() {
              Text('泡泡').fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
              Text('微信号：wxid_abc123').fontSize(13).fontColor('rgba(0, 0, 0, 0.55)').margin({ top: 4 })
            }.alignItems(HorizontalAlign.Start)
            Blank()
            Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
          }.width('100%').height(80).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          .onClick(() => { router.pushUrl({ url: 'pages/profilePage' }) })

          Column() {}.width('100%').height(10).backgroundColor('#EDEDED')

          // 账号与安全
          Row() { Text('账号与安全').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)'); Blank(); Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)') }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
            .onClick(() => { this.showDialog = true })
          Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)').margin({ left: 16 })

          Column() {}.width('100%').height(10).backgroundColor('#EDEDED')

          // 通用
          Row() { Text('通用').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)'); Blank(); Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)') }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)').margin({ left: 16 })

          Column() {}.width('100%').height(10).backgroundColor('#EDEDED')

          // 帮助与反馈
          Row() { Text('帮助与反馈').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)'); Blank(); Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)') }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
          Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)').margin({ left: 16 })

          // 关于微信
          Row() { Text('关于微信').fontSize(16).fontColor('rgba(0, 0, 0, 0.9)'); Blank(); Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)') }.width('100%').height(52).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')

          Column() {}.width('100%').height(10).backgroundColor('#EDEDED')

          // 退出登录
          Row() { Text('退出登录').fontSize(16).fontWeight(FontWeight.Medium).fontColor('#FA5151').width('100%').textAlign(TextAlign.Center) }.width('100%').height(52).backgroundColor('#FFFFFF')
            .onClick(() => { router.replaceUrl({ url: 'pages/login' }) })
        }.width('100%')
      }.layoutWeight(1).backgroundColor('#EDEDED')

      // 密码修改对话框：使用 position 实现全屏覆盖（替代原 Stack 容器方案）
      if (this.showDialog) {
        Column() {
          Column() {
            Text('修改密码').fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)').margin({ bottom: 20 })
            TextInput({ placeholder: '旧密码' }).type(InputType.Password).width('100%').height(44).margin({ bottom: 12 }).onChange(v => this.oldPwd = v)
            TextInput({ placeholder: '新密码' }).type(InputType.Password).width('100%').height(44).margin({ bottom: 20 }).onChange(v => this.newPwd = v)
            Row() {
              Button('取消').layoutWeight(1).height(40).backgroundColor('#F5F5F5').fontColor('rgba(0, 0, 0, 0.9)').onClick(() => { this.showDialog = false })
              Button('确定').layoutWeight(1).height(40).backgroundColor('#07C160').fontColor('#FFFFFF').margin({ left: 12 }).onClick(() => {
                if (this.oldPwd === '123456' && this.newPwd.length >= 6) { this.getUIContext().getPromptAction().showToast({ message: '修改成功', duration: 2000 }); this.showDialog = false }
                else { this.getUIContext().getPromptAction().showToast({ message: '旧密码错误', duration: 2000 }) }
              })
            }.width('100%')
          }.width('80%').padding(24).backgroundColor('#FFFFFF').borderRadius(12)
        }.width('100%').height('100%').position({ x: 0, y: 0 }).backgroundColor('#00000060').justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center).onClick(() => { this.showDialog = false })
      }
    }.width('100%').height('100%').backgroundColor('#EDEDED').justifyContent(FlexAlign.Start).alignItems(HorizontalAlign.Start)
  }
}
