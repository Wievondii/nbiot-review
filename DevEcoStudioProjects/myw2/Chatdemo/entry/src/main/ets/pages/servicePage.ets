import router from '@ohos.router';
@Entry
@Component
struct ServicePage {
  private randomAmount: string = ''
  aboutToAppear() {
    this.randomAmount = (Math.random() * 1000 + 10).toFixed(2)
  }
  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('rgba(0, 0, 0, 0.9)').margin({ right: 16 }).onClick(() => { router.back() })
        Text('服务').fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
      Divider().strokeWidth(0.5).color('rgba(0, 0, 0, 0.1)')
      Scroll() {
        Column() {
          // 顶部绿色双入口大卡片
          Row() {
            Column() {
              Text('💳').fontSize(32).margin({ bottom: 8 })
              Text('收付款').fontSize(16).fontColor('#FFFFFF')
            }.layoutWeight(1).height(100).justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
            .onClick(() => { router.pushUrl({ url: 'pages/wechatPayPage' }) })
            Divider().vertical(true).strokeWidth(0.5).color('#FFFFFF40').height(60)
            Column() {
              Text('💰').fontSize(32).margin({ bottom: 4 })
              Text('钱包').fontSize(16).fontColor('#FFFFFF')
              Text('¥' + this.randomAmount).fontSize(12).fontColor('#FFFFFFCC').margin({ top: 4 })
            }.layoutWeight(1).height(100).justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
            .onClick(() => { router.pushUrl({ url: 'pages/wechatPayPage' }) })
          }.width('100%').backgroundColor('#07C160').borderRadius(12).margin({ left: 16, right: 16, top: 12 })
          .padding({ top: 12, bottom: 12 })

          // 金融理财
          Column() {
            Text('金融理财').fontSize(13).fontColor('rgba(0, 0, 0, 0.55)').width('100%').padding({ left: 16, top: 12, bottom: 8 })
            Grid() {
              GridItem() { this.gridItem('💰', '理财通') }
              GridItem() { this.gridItem('📊', '信用卡') }
              GridItem() { this.gridItem('🏠', '保险') }
              GridItem() { this.gridItem('📈', '股票') }
            }.columnsTemplate('1fr 1fr 1fr 1fr').rowsTemplate('1fr').width('100%').height(90).backgroundColor('#FFFFFF')
          }.width('100%').backgroundColor('#FFFFFF').borderRadius(12).margin({ left: 16, right: 16, top: 12 })

          // 生活服务
          Column() {
            Text('生活服务').fontSize(13).fontColor('rgba(0, 0, 0, 0.55)').width('100%').padding({ left: 16, top: 12, bottom: 8 })
            Grid() {
              GridItem() { this.gridItem('🛒', '购物') }
              GridItem() { this.gridItem('🎮', '游戏') }
              GridItem() { this.gridItem('🚗', '出行') }
              GridItem() { this.gridItem('🍔', '外卖') }
              GridItem() { this.gridItem('🎬', '电影') }
              GridItem() { this.gridItem('🏨', '酒店') }
              GridItem() { this.gridItem('💊', '医疗') }
              GridItem() { this.gridItem('📚', '教育') }
            }.columnsTemplate('1fr 1fr 1fr 1fr').rowsTemplate('1fr 1fr').width('100%').height(180).backgroundColor('#FFFFFF')
          }.width('100%').backgroundColor('#FFFFFF').borderRadius(12).margin({ left: 16, right: 16, top: 12 })

          // 交通出行
          Column() {
            Text('交通出行').fontSize(13).fontColor('rgba(0, 0, 0, 0.55)').width('100%').padding({ left: 16, top: 12, bottom: 8 })
            Grid() {
              GridItem() { this.gridItem('✈️', '机票') }
              GridItem() { this.gridItem('🚄', '火车票') }
              GridItem() { this.gridItem('🚕', '打车') }
              GridItem() { this.gridItem('🚌', '公交') }
            }.columnsTemplate('1fr 1fr 1fr 1fr').rowsTemplate('1fr').width('100%').height(90).backgroundColor('#FFFFFF')
          }.width('100%').backgroundColor('#FFFFFF').borderRadius(12).margin({ left: 16, right: 16, top: 12 })

          // 购物消费
          Column() {
            Text('购物消费').fontSize(13).fontColor('rgba(0, 0, 0, 0.55)').width('100%').padding({ left: 16, top: 12, bottom: 8 })
            Grid() {
              GridItem() { this.gridItem('🏪', '京东') }
              GridItem() { this.gridItem('🛍️', '拼多多') }
              GridItem() { this.gridItem('👕', '唯品会') }
              GridItem() { this.gridItem('📺', '苏宁') }
            }.columnsTemplate('1fr 1fr 1fr 1fr').rowsTemplate('1fr').width('100%').height(90).backgroundColor('#FFFFFF')
          }.width('100%').backgroundColor('#FFFFFF').borderRadius(12).margin({ left: 16, right: 16, top: 12, bottom: 16 })
        }.width('100%')
      }.layoutWeight(1).backgroundColor('#EDEDED')
    }.width('100%').height('100%').backgroundColor('#EDEDED').justifyContent(FlexAlign.Start).alignItems(HorizontalAlign.Start)
  }

  @Builder
  gridItem(icon: string, title: string) {
    Column() {
      Text(icon).fontSize(24).margin({ bottom: 6 })
      Text(title).fontSize(12).fontColor('rgba(0, 0, 0, 0.9)')
    }.width('100%').height('100%').justifyContent(FlexAlign.Center).alignItems(HorizontalAlign.Center)
    .onClick(() => { this.getUIContext().getPromptAction().showToast({ message: title, duration: 1500 }) })
  }
}
