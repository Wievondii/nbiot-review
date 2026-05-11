import router from '@ohos.router';
@Entry
@Component
struct PwdLogin {
  @State password: string = ''
  @State lock: boolean = false
  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('#000000').margin({ right: 16 }).onClick(() => { router.back() })
      }.width('100%').height(50).padding({ left: 16 })
      Text('手机号登录').fontSize(22).fontWeight(FontWeight.Bold).fontColor('#000000').margin({ top: 20, bottom: 30 }).width('100%').textAlign(TextAlign.Center)
      Column() {
        Row() {
          Text('+86').fontSize(16).fontColor('#000000').margin({ right: 8 })
          TextInput({ placeholder: '请输入手机号' }).type(InputType.PhoneNumber).layoutWeight(1).height(44).fontSize(16)
        }.width('90%').height(44).alignItems(VerticalAlign.Center)
        Divider().strokeWidth(0.5).width('90%')
        Row() {
          Text('密码').fontSize(16).fontColor('#000000').width(50)
          TextInput({ placeholder: '请填写密码' }).type(InputType.Password).layoutWeight(1).height(44).fontSize(16)
            .onChange(val => this.password = val)
        }.width('90%').height(44).margin({ top: 16 }).alignItems(VerticalAlign.Center)
        Divider().strokeWidth(0.5).width('90%')
      }.width('100%').alignItems(HorizontalAlign.Center)
      Blank()
      Button('登录').fontSize(16).fontColor('#FFFFFF').width('85%').height(48).borderRadius(8).backgroundColor('#07C160').enabled(!this.lock)
        .onClick(() => {
          if (this.lock) return
          this.lock = true
          if (this.password === '123456') { router.replaceUrl({ url: 'pages/mainPage' }) }
          else { this.getUIContext().getPromptAction().showToast({ message: '密码错误，请输入123456', duration: 2000 }) }
          this.lock = false
        })
      Row({ space: 40 }) {
        Text('找回密码').fontSize(14).fontColor('#576B95')
        Text('更多').fontSize(14).fontColor('#576B95')
      }.margin({ top: 20, bottom: 40 })
    }.width('100%').height('100%').backgroundColor('#FFFFFF')
  }
}