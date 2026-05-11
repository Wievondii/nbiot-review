import router from '@ohos.router';
@Entry
@Component
struct ShopPage {
  build() {
    Column() {
      Row() {
        Text('<').fontSize(22).fontColor('rgba(0, 0, 0, 0.9)').margin({ right: 16 })
          .onClick(() => { router.back() })
        Text('购物').fontSize(18).fontWeight(FontWeight.Bold).fontColor('rgba(0, 0, 0, 0.9)')
        Blank()
      }.width('100%').height(50).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')

      List() {
        this.shopItem('京东', '京东购物，多快好省')
        this.shopItem('拼多多', '拼着买，更便宜')
        this.shopItem('唯品会', '品牌特卖，超值折扣')
        this.shopItem('苏宁易购', '家电数码，正品保障')
        this.shopItem('淘宝', '万能的淘宝')
      }.layoutWeight(1).divider({ strokeWidth: 0 })
    }.width('100%').height('100%').backgroundColor('#EDEDED').justifyContent(FlexAlign.Start).alignItems(HorizontalAlign.Start)
  }

  @Builder
  shopItem(name: string, desc: string) {
    ListItem() {
      Row() {
        Text('🛒').fontSize(24).width(40).height(40).textAlign(TextAlign.Center).backgroundColor('#F5F5F5').borderRadius(8).margin({ right: 12 })
        Column() {
          Text(name).fontSize(16).fontColor('rgba(0, 0, 0, 0.9)')
          Text(desc).fontSize(12).fontColor('rgba(0, 0, 0, 0.55)').margin({ top: 4 })
        }.alignItems(HorizontalAlign.Start)
        Blank()
        Text('>').fontSize(16).fontColor('rgba(0, 0, 0, 0.3)')
      }.width('100%').height(70).padding({ left: 16, right: 16 }).backgroundColor('#FFFFFF')
    }.onClick(() => { this.getUIContext().getPromptAction().showToast({ message: name, duration: 1500 }) })
  }
}
