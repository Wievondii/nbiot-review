
@Component
export struct Index11 {
  @State message: string = '我是Index组件11';
  build() {
      Row(){
        Text(this.message)
          .id('HelloWorld11')
          .fontSize($r('app.float.page_text_font_size'))
          .fontWeight(FontWeight.Bold)
          .alignRules({
            center: { anchor: '__container__', align: VerticalAlign.Center },
            middle: { anchor: '__container__', align: HorizontalAlign.Center }
          })
          .onClick(() => {
            this.message = 'Welcome';
          })
      }.height('20%')
  }
}

@Component
export struct Index12 {
  @State message: string = '我是Index组件12';
  build() {
    Row(){
      Text(this.message)
        .id('HelloWorld12')
        .fontSize($r('app.float.page_text_font_size'))
        .fontWeight(FontWeight.Bold)
        .alignRules({
          center: { anchor: '__container__', align: VerticalAlign.Center },
          middle: { anchor: '__container__', align: HorizontalAlign.Center }
        })
        .onClick(() => {
          this.message = 'Welcome';
        })
    }.height('20%')
  }
}