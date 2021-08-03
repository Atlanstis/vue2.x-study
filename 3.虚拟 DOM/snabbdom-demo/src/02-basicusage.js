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
