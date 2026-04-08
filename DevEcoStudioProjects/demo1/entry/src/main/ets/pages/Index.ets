import { hilog } from '@kit.PerformanceAnalysisKit';

let DOMAIN:number=0x0000;
let TAG_PAGE='IndexLife'
@Entry//声明一个入口
@Component//声明一个组件
struct Index {//struct是声明组件的一个关键词   Index是组件的名字

  // 1. 页面即将创建
  aboutToAppear() {
    hilog.info(DOMAIN, TAG_PAGE, "aboutToAppear：页面即将创建，这是第%{public}s个函数",1);
  }

  // 2. 页面UI构建完成
  onDidBuild() {
    hilog.info(DOMAIN, TAG_PAGE, "onDidBuild：页面UI构建完成，这是第%{public}s个函数",2);
  }

  // 3. 页面完全显示（每次显示都触发）
  onPageShow() {
    hilog.info(DOMAIN, TAG_PAGE, "onPageShow：页面已显示，这是第%{public}s个函数",3);
  }

  // 4. 页面完全隐藏（每次隐藏都触发）
  onPageHide() {
    hilog.info(DOMAIN, TAG_PAGE, "onPageHide：页面已隐藏，这是第%{public}s个函数",4);
  }

  // 5. 页面返回键点击（页面独有！组件没有）
  onBackPress() {
    hilog.info(DOMAIN, TAG_PAGE, "onBackPress：点击页面返回键，这是第%{public}s个函数",5);
    return false; // false=系统默认返回，true=自己处理返回逻辑
  }

  // 6. 页面即将销毁
  aboutToDisappear() {
    hilog.info(DOMAIN, TAG_PAGE, "aboutToDisappear：页面即将销毁，这是第%{public}s个函数",6);
  }
  @State message: string = 'Hello World';//@state作用是声明当前这个变量  的变化和UI相绑定
  build() {
    RelativeContainer(){
      Text(this.message)
        .id('HelloWorld')
        .fontSize($r('app.float.page_text_font_size'))
        .fontWeight(FontWeight.Bold)
        .alignRules({
          center: { anchor: '__container__', align: VerticalAlign.Center },
          middle: { anchor: '__container__', align: HorizontalAlign.Center }
        })
        .onClick(()=>{
          this.message='hello boy'
        })
    }
    .height('100%')
    .width('100%')

  }
}

