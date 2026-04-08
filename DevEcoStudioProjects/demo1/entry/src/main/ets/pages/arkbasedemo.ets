// 基本类型声明
let str1:string='hello world';
let str2:string=`The word is ${str1}`
let num2:number=0x1234;
let num3:number=1234;
let num4:number=0o77;
let num5:number=0b11;
let num6:number=0.5;
let num7:number=1e2;
let boo1:boolean=true;

//void类型用于函数和泛型声明

//Object类型（非基本类型 或者叫 对象类型  注意Object是大写开头）
let o1:Object='hello';
let o2:Object=[1,2,3,4];
let o3:Object=['1','2','3','4'];
//数组类型
let arr:string[]=['a','b','c'];
let arr1:number[]=[1,2,3];
//枚举类型
enum ColorSet{Red,Green,Blue}
enum ColorSet1{Red=1,Green=3,Blue=4}
let c:ColorSet=ColorSet.Red;


//联合类型
class Boy{
  name:string='张三';
  play(){
    console.log('玩游戏')
  }
}
class Girl{
  name:string='李四'
  shopping(){
    console.log('购物')
  }
}
type People=Boy|Girl;
let p1:People=new Boy();
let p2:People=new Girl();

//函数声明
function action(param:People):void{
  if(param instanceof Boy){
    console.log('people类型来源于Boy类型')
  }
  if(param instanceof Girl){
    console.log('people类型来源于Girl类型')
  }
}
//函数调用时判断联合类型的具体类型
action(p1);
action(p2);

//匿名类型 Aliases 为已定义类型提供代名词
  type Martrix=number[][];
const gamecell:Martrix=[[1,2],[3,4]];

//使用匿名类型定义函数规则
type JustDo=(s:number,n:number)=>number;
//定义函数实现
const j:JustDo=(a,b)=>{
  return a+b;
}
//函数调用
j(1,2);

//带有泛型的函数声明
type Hello<T>=(t:T)=>T//类型名=函数规则
let h:Hello<number>=(num)=>{
  return num*10;
}
h(10);
let h1:Hello<string>=(str):string=>{
  return str.toString();
}
h1('hello');

type NullableObject=Object|null;
let animalData: NullableObject = new Boy();
let emptyData: NullableObject = null;

//===与===的区别  三目运算 略




type trigFunc = (x: number) => number // 这是一个函数类型

function do_action(f: trigFunc) {
  f(3.141592653589); // 调用函数
}

do_action((y:number)=>{return y*y}); // 将函数作为参数传入

do_action(Math.sin);



