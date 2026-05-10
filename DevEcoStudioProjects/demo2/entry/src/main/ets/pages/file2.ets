
@Component
export struct Index21 {
  @State message: string = '我是Index组件21';

  build() {
      Row(){
        Text(this.message)
          .id('HelloWorld21')
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
export struct Index22 {
  @State message: string = '我是Index组件22';

  build() {
    Row(){
      Text(this.message)
        .id('HelloWorld22')
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