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
