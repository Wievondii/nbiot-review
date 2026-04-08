//传统函数声明
function add(x:string,y:string):string{
  return `${x}+${y}`
}
//可选参数使用?    注意必填参数放在前面，可选参数放在后面 否则编译出错
function add1(x:string,y?:string):string{
  return `${x}${y}`
}

//参数设置默认值
function add2(x:string,y:string='HELLO'):string{
  return `${x}${y}`
}

//函数中的rest参数 （不定长参数）
function dosum(...arr:number[]):number{
  let sum:number=0;
  for(let each of arr){
    sum+=each;
  }
  return sum;
}
dosum(1,2,3,4);

//函数返回空
function fn1(p1:string,p2:string):void{
  console.log(p1+p2);
}

//函数作为参数传入函数中 有两种用法：
//1.定义函数类型----传入函数类型及所需参数----调用整个函数并实现函数类型
type ft=(p1:number,p2:number)=>number;
function fn2(m:ft):number{
  return m(3, 4);//函数实现不明 但传入参数确定
}
//调用fn2函数，并传入函数实现
fn2((a:number,b:number):number=>{
  return Math.sqrt(a)+Math.sqrt(b);
})
//调用fn2函数，并传入函数实现，这里使用内置函数来实现这个函数  由于Math.sin是单参数 但函数类型是2个参数的
//arkTS通过强制匹配 将第一个参数传入了函数Math.sin中 第二个参数没有任何作用
// fn2(Math.sin);

//2.变量：函数类型=函数实现
let mm:(a:number,b:number)=>string=
  (a:number,b:number):string=>{
  return a.toString()+b.toString();
}
mm(1,3)

//箭头函数
//函数体只有一句 则不用return
let sum=(x:number,y:number):number=> x+y;
let sum1=(x:number):number=>x*2;
let sum2=():void=>console.log('hello world');
let sum3=(x:number,y:number):number=>{
  return Math.sqrt(x)+Math.sqrt(y)
}

//闭包   底层逻辑：闭包会形成一条持续的引用链，让垃圾回收器（GC）认为这些变量还在被使用，因此不会回收
function f(): () => number {
  let count = 0;
  let g = (): number => { count++; return count; };
  return g;
}

let z=f();
z();
z();
z();
//全局变量z持有f引用，f持有g的引用，虽然f执行完毕，理应释放count变量，但是
//GC 遍历引用链时发现z---》f----》g-----》count  因此只要z不解除引用 count就一直保持。
//思考 下面的z1是什么类型，后面为什么加null？？？
let z1:(() => number)|null= f();
z1(); // 返回：1
z1(); // 返回：2
//为了避免内存泄露，解除引用
z1=null;

let c:(x:number,y:number)=>string=(a:number,b:number)=>{
  return (Math.sqrt(a)+Math.sqrt(b)).toString();
}

//箭头函数和普通函数的转换
function sumA(x:number,y:number):number{
  return x+y;
}

let sumB=(x:number,y:number):number=>{
  return x+y;
}

function fx111(): () => number {
  let count = 0;
  let g = (): number => { count++; return count; };
  return g;
}









