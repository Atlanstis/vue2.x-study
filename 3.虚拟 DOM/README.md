# 虚拟 DOM

## 虚拟 DOM 的作用

- 维护试图和状态的关系
- 复杂视图情况下提升渲染性能
- 跨平台
  - 浏览器平台渲染 DOM
  - 服务端渲染 SSR（Nuxt.js/Next.js）
  - 原生应用（Wexx/React Native）
  - 小程序（mpVue/uni-app）等

## 虚拟 DOM 库

### Snabbdom

- Vue.js 2.x 内部使用的虚拟 DOM 就是改造的 Snabbdom
- 大约 200 SLOC（single line of code）
- 通过模块可拓展
- 源码使用 TypeScript 开发
- 最快的 Virtual DOM 之一

### virtual-dom

## Snabbdom 使用

[Snabbdom git地址](https://github.com/snabbdom/snabbdom)

### 基础使用

```js
import { init } from 'snabbdom/build/package/init'
import { h } from 'snabbdom/build/package/h'
```

由于 snabbdom 在 package.json 中，使用 exports 属性来进行拓展路径，但此属性在 webpack5 之后才支持，因此我们需通过引入全路径的方式，获取到 snabbdom 中的成员函数。

#### 创建文本 DOM

```js
import { init } from 'snabbdom/build/package/init'
// 用来创建虚拟 dom
import { h } from 'snabbdom/build/package/h'

// 对比两个 VNode 将差异部分渲染到真实 dom 上
const patch = init([])

// 第一个参数：标签+选择器
// 第二个参数：如果是字符串就是标签中的文本内容
let vnode = h('div#container.cls', 'Hello World')
const app = document.querySelector('#app')

// 第一个参数：旧的 VNode，可以是真实 DOM，此时会将真实 DOM 渲染为 VNode
// 第二个参数：新的 VNode
// 返回新的 VNode
let oldVnode = patch(app, vnode)

// 更新 DOM
vnode = h('div#container.xc', 'Hello Snabbdom')
patch(oldVnode, vnode)
```

#### 创建包含子节点的 DOM

```js
import { init } from 'snabbdom/build/package/init'
import { h } from 'snabbdom/build/package/h'

const patch = init([])

// 创建包含子节点的 DOM
let vnode = h('div#container', [
  h('h1', 'Hello Snabbdom'),
  h('p', 'hello world')
])
const app = document.querySelector('#app')

let oldVnode = patch(app, vnode)

setTimeout(() => {
  // 使用注释节点，清除 div 内容
  patch(oldVnode, h('!'))
}, 2000)
```

#### 模块

##### 作用

- Snabbdom 的核心库并不能处理 DOM 元素的属性/样式/事件等，可以通过注册 Snabbdom 默认提供的模块来实现
- Snabbdom 中的模块可以用来拓展 Snabbdom 的功能
- Snabbdom 中的模块的实现是通过注册全局的钩子函数来实现的

##### 官方提供的模块

- attributes
- props
- dataset：html5 提供的 data- 属性
- class：切换类
- style
- eventlisteners

##### 模块使用步骤

- 导入需要的模块
- init() 中注册模块
- h() 函数的第二个参数处使用模块

