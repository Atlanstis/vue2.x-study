# 响应式原理

## 数据响应式核心原理

### Vue2.x

- Object.defineProperty
- 浏览器兼容 IE8 以上（不兼容 IE8）

```js
// 模拟 Vue 中的 data 选项
let data = {
  msg: 'hello'
}

// 模拟 Vue 的实例
let vm = {}

// 数据劫持：当访问或者设置 vm 中的成员的时候，做一些干预操作
Object.defineProperty(vm, 'msg', {
  // 可枚举（可遍历）
  enumerable: true,
  // 可配置（可以使用 delete 删除，可以通过 defineProperty 重新定义）
  configurable: true,
  // 当获取值的时候执行
  get () {
    console.log('get: ', data.msg)
    return data.msg
  },
  // 当设置值的时候执行
  set (newValue) {
    console.log('set: ', newValue)
    if (newValue === data.msg) {
      return
    }
    data.msg = newValue
    // 数据更改，更新 DOM 的值
    document.querySelector('#app').textContent = data.msg
  }
})

// 测试
vm.msg = 'Hello World'
console.log(vm.msg)
```

### Vue3.x

- Proxy
- 直接监听对象，而非属性
- ES 6 新增，IE 不支持，性能由浏览器决定

```js
// 模拟 Vue 中的 data 选项
let data = {
  msg: 'hello',
  count: 0
}

// 模拟 Vue 实例
let vm = new Proxy(data, {
  // 执行代理行为的函数
  // 当访问 vm 的成员会执行
  get (target, key) {
    console.log('get, key: ', key, target[key])
    return target[key]
  },
  // 当设置 vm 的成员会执行
  set (target, key, newValue) {
    console.log('set, key: ', key, newValue)
    if (target[key] === newValue) {
      return
    }
    target[key] = newValue
    document.querySelector('#app').textContent = target[key]
  }
})

// 测试
vm.msg = 'Hello World'
console.log(vm.msg)
```

## 发布订阅模式和观察者模式

### 发布/订阅模式

我们假定，存在一个"信号中心"，某个任务执行完成，就向信号中心"发布"（publish）一个信号，其他任务可以向信号中心"订阅"（subscribe）这个信号，从而知道什么时候自己可以开始执行。这就叫做**发布/订阅模式**。

- 订阅者
- 发布者
- 信号中心

#### 模拟实现

```js
class EventEmitter {
  constructor () {
    this.subs = Object.create(null)
  }
	// 订阅通知
  $on (eventName, handler) {
    this.subs[eventName] = this.subs[eventName] || []
    this.subs[eventName].push(handler)
  }
	// 发布通知
  $emit (eventName) {
    if (this.subs[eventName]) {
      his.subs[eventName].forEach((handler) => {
        handler()
      })
    }
  }
}
```

### 观察者模式

- 观察者(订阅者) -- Watcher

  update()：当事件发生时，具体要做的事情

- 目标(发布者) -- Dep

  subs 数组：存储所有的观察者

  addSub()：添加观察者

  notify()：当事件发生，调用所有观察者的 update() 方法

- 没有事件中心

#### 模拟实现

```js
// 目标(发布者)
// Dependency
class Dep {
  constructor () { 
  // 存储所有的观察者
  this.subs = [] 
  }

  // 添加观察者
  addSub (sub) {
    if (sub && sub.update) {
      this.subs.push(sub)
    }
  }

  // 通知所有观察者
  notify () {
    this.subs.forEach((sub) => {
      sub.update()
    })
  }
}

// 观察者(订阅者)
class Watcher {
  update () {
    console.log('update')
  }
}

// 测试
let dep = new Dep()
let watcher = new Watcher()
dep.addSub(watcher)
dep.notify()
```

### **总结**

- **观察者模式**是由具体目标调度，比如当事件触发，Dep 就会去调用观察者的方法，所以观察者模式的订阅者与发布者之间是存在依赖的。
- **发布/订阅模式**由统一调度中心调用，因此发布者和订阅者不需要知道对方的存在。

## 模拟 Vue 响应式原理

### Vue

- 负责接收初始化的参数（选项）
- 负责把 data 中的属性注入到 Vue 实例，转换成 getter / setter
- 负责调用 Observer 监听 data 中所有属性的变化
- 负责调用 compiler 解析指令 / 差值表达式

### Observer

- 负责把 data 选项中的属性转换成响应式数据
- data 中的某个属性也是对象，把该属性也转换成响应式数据
- 数据变化发生通知

###  Compiler

- 负责编译模板，解析指令/差值表达式
- 负责页面的首次渲染
- 当数据变化后重新渲染视图

### Dep（Dependency）

- 收集依赖，添加观察者（Watcher）
- 通知所有观察者

### Watcher

- 当数据变化触发依赖，dep 通知所有的 Watcher 实例更新视图
- 自身实例化的时候，往 dep 对象中添加自己