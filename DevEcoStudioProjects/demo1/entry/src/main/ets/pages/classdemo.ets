//创建一个类 带有成员变量 构造方法 和getter setter函数
//知识点：默认修饰符为public 如果没有构造函数，则存在存在隐形的无参构造
class People{
  name:string;
  constructor(t:string){
    this.name=t;
  }
  setName(t:string):void{
    this.name=t;
  }

  getName():string{
    return this.name;
  }
}

//知识点：通过new创建实例
let p=new People('张三');

//知识点：对象字面量配合interface、class能够快速创建一些纯属性结构数据。
interface Result{
  code:number;
  message:string;
}
let p1:Result={code:200,message:'响应成功'};

class Result1{
  code:number=0;
  message:string='';
}
let p2:Result1={code:200,message:'响应成功'};

//※※※※※※两种虽然都是创建对象实例，但是最佳实践告诉我们，不同的场景需要选择不同的创建方法
// 用对象字面量：
// 场景：存储纯数据、函数传参、临时配置、动态结构；
// 搭配：接口（interface）/ 类型别名（type）；
// 核心价值：极简、灵活、无冗余代码。快速构建和使用

// 用 new 创建类实例：
// 场景：需要封装方法（行为）、继承、原型链、状态管理；
// 搭配：类（class）；
// 核心价值：代码复用、行为封装、类型安全。

//抽象类
abstract class Animal{
  id:number;
  name:string;
  age:number;
  constructor(id: number, name: string, age: number) {
    this.id = id;
    this.name = name;
    this.age = age;
  }
  abstract eat():void;
  sleep():void{
    console.log('抽象类中的方法实现')
  }
}
//继承抽象类
class Animal1 extends Animal{
  eat(): void {
    throw new Error('Method not implemented.');
  }

}

//接口 定义属性和未实现的方法
interface Action{
  //哪里
  x:number;
  y:number;
  //干什么
  eat():void;
  sleep():void;
  calculate():number;
}
//继承类并实现接口
class People2 extends People implements Action{
  x: number=1;
  y: number=1;
  eat(): void {
    throw new Error('Method not implemented.');
  }

  sleep(): void {
    throw new Error('Method not implemented.');
  }

  calculate(): number {
    throw new Error('Method not implemented.');
  }

}


//抽象类和接口的区别：抽象类可以部分实现，接口全都不实现

//将之前的people类改成泛型类 并命名为People3
class People3<T>{
  name:T;
  constructor(t:T){
    this.name=t;
  }
  setName(t:T){
    this.name=t;
  }

  getName():T{
    return this.name;
  }
}

class Water{
  color:string='transplate';
  temperature:number=30;
  ate():void{
    console.log('喝白开水')
  };
}

class Drink extends Water{
  color:string='orange';
  temperature:number=30;
  ate():void{
    console.log('喝橙汁')
  }
}
//构建一个People4泛型约束为water的后代  继承People 并且有个新属性 age 类型为number，People3的泛型为Water
class People4<T extends Water> extends People3<Water>{
  age:number=20;
}
//请创建People4的实例
let w=new Drink();
let p4=new People4<Drink>(w);

//
function doCount(arr:number[]):number{
  return arr[arr.length-1];
}
function doCount1(arr:string[]):string{
  return arr[arr.length-1];
}
function doCount2(arr:boolean[]):boolean{
  return arr[arr.length-1];
}
function doCount3<T>(arr:T[]):T{
    return arr[arr.length-1];
}


let dc3=doCount3<boolean>([true,false,true,false]);

//泛型默认值  在泛型位置赋值 就是这个泛型默认值

//※※※※※ArkTs中所有类型不能为空 对应TypeScript中的strictNullCheck模式
// let x:number=null;
// let y:string=null;
// let z:number[]=null;
//通过联合类型来解决这个问题
let x:number|null=null;
//非空断言运算符 主要针对实例对象中的属性可能为空的情况 !
class A{
  value:number=0;
}
function dosth(a:A|null){
  return a!.value;//告诉编译器 这个不会是为空（有风险）  如果真的为空 则运行会报错
}
//空值合并运算符 ??
class Member {
  name:string='';
  age:number=0;
  address:string|null=null;
  getNick(): string {
    return this.address ?? '';//含义为如果address有值则正常使用 没有值则输出空字符串
  }
}
//对象属性的访问如果可能为空 使用可选链
class Pet{
  name:string='';
}
class Member1 {
  name:string='';
  age:number=0;
  pet?:Pet; //pet有可能为空

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
    this.pet = undefined;
  }
  address:string|null=null;
  getNick(): string {
    return this.address ?? '';//含义为如果address有值则正常使用 没有值则输出空字符串
  }
}
let m1=new Member1('zhangsan',20);
m1.pet?.name //这个pet实例其实是undefine






