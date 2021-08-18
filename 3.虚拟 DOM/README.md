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

## Snabbdom

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

### Snabbdom 核心

- init() 设置模块，创建 patch() 函数
- 使用 h() 函数创建 JavaScript 对象（VNode） 描述真实 DOM
- patch()  比较新旧两个 Vnode
- 把变化的内容更新到真实 DOM 树

### 源码解析

#### h 函数介绍

- 作用：创建 VNode 对象

```typescript
export function h (sel: any, b?: any, c?: any): VNode {
  var data: VNodeData = {}
  var children: any
  var text: any
  var i: number
  // 处理参数，实现函数的重载
  if (c !== undefined) {
    // 处理三个函数的情况
    // sel，data，children/text
    if (b !== null) {
      data = b
    }
    if (is.array(c)) {
      children = c
    } else if (is.primitive(c)) {
      // 如果 c 是字符串或数字
      text = c
    } else if (c && c.sel) {
      // 如果 c 是 Vnode
      children = [c]
    }
  } else if (b !== undefined && b !== null) {
    // 处理两个参数的情况
    // 如果 b 是数组
    if (is.array(b)) {
      children = b
      // 如果 b 是字符串或者数字
    } else if (is.primitive(b)) {
      text = b
    } else if (b && b.sel) {
      children = [b]
    } else { data = b }
  }
  if (children !== undefined) {
    // 处理 children 中的原始值（string/number）
    for (i = 0; i < children.length; ++i) {
      // 如果 child 是 string/number，创建文本节点
      if (is.primitive(children[i])) children[i] = vnode(undefined, undefined, undefined, children[i], undefined)
    }
  }
  if (
    sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
    (sel.length === 3 || sel[3] === '.' || sel[3] === '#')
  ) {
    // 如果是 svg，添加命名空间
    addNS(data, children, sel)
  }
  // 返回 VNode
  return vnode(sel, data, children, text, undefined)
};
```

#### vnode 函数

返回一个 JavaScript 对象，用于描述 DOM 节点。

```typescript
export function vnode (sel: string | undefined,
  data: any | undefined,
  children: Array<VNode | string> | undefined,
  text: string | undefined, // children 与 text 互斥
  elm: Element | Text | undefined): VNode {
  const key = data === undefined ? undefined : data.key
  return { sel, data, children, text, elm, key }
} 
```

#### patch 整体过程分析

- patch(oldVnode, newVnode)
- 把新节点中变化的内容渲染到真实 DOM，最后返回新节点作为下一次处理的旧节点
- 对比新旧 VNode 是否相同节点（节点的 key 和 sel 相同）
- 如果不是相同节点，删除之前的内容，重新渲染
- 如果是相同节点，再判断新的 VNode 是否有 text，如果有并且和 oldVNode 的 text 不同，直接更新文本内容
- 如果新的 VNode 有 children，判断子节点是否有变化

#### init 函数

用于创建 patch 函数。

1. 通过 domApi 指定如何转化虚拟DOM，默认转化成浏览器环境下的 DOM 对象。
2. 收集模块中的钩子函数，以便这些钩子函数在特定的时间被执行。
3. 定义需要的内部函数。
4. 返回 patch 函数。

#### patch 函数

 对比新旧 Vnode，并将差异渲染到真实 DOM 上，并返回最新的 vNode。

1. 初始化参数，并定义 insertedVnodeQueue，存储新插入节点的队列，目的是为了触发这些节点的 insert 钩子函数。
2. 遍历使用模块的 pre 钩子函数，并执行。
3. 判断第一个参数 oldVnode 是否为 vNode（可以为真实 DOM 节点），如果不是，则将其转换为 vNode。
4. 判断 新旧 vNode 是否为相同节点：（判断依据为，key 与 sel 是否相同）
   1. 如果是，调用 patchVnode 方法，计算出新旧的节点的差异。
   2. 如果不是，调用 createElm 方法，将新节点转换为真实 DOM 元素，并将 insertedVnodeQueue 作为参数传入，同时会触发相对应的钩子函数。之后将新创建的 真实 DOM 元素挂载到 DOM 树上，之后将旧节点移除。
5. 触发新插入节点的队列的 insert 钩子函数（比如计算插入元素的行高等）。
6. 触发使用模块的 post 钩子函数。
7. 返回 vnode 节点，用于下一次的处理 oldVnode 使用。

```typescript
function patch (oldVnode: VNode | Element, vnode: VNode): VNode {
    let i: number, elm: Node, parent: Node
    // 存储新插入节点的队列，目的是为了触发这些节点的 insert 钩子函数
    const insertedVnodeQueue: VNodeQueue = []
    for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]()

    if (!isVnode(oldVnode)) {
      oldVnode = emptyNodeAt(oldVnode)
    }

    if (sameVnode(oldVnode, vnode)) {
      patchVnode(oldVnode, vnode, insertedVnodeQueue)
    } else {
      elm = oldVnode.elm!
      parent = api.parentNode(elm) as Node

      createElm(vnode, insertedVnodeQueue)

      if (parent !== null) {
        api.insertBefore(parent, vnode.elm!, api.nextSibling(elm))
        removeVnodes(parent, [oldVnode], 0, 0)
      }
    }

    for (i = 0; i < insertedVnodeQueue.length; ++i) {
      insertedVnodeQueue[i].data!.hook!.insert!(insertedVnodeQueue[i])
    }
    for (i = 0; i < cbs.post.length; ++i) cbs.post[i]()
    return vnode
  }
```

#### createElm 函数

将 vNode 转换为对应的 DOM，并把 DOM 元素，存放在 vNode 的 elm 属性中。

1.  执行用户设置的 init 函数
2. 把 vNode 转换成真实 DOM 对象（没有渲染到页面）
3. 返回新创建的 DOM

```typescript
  function createElm (vnode: VNode, insertedVnodeQueue: VNodeQueue): Node {
    // 执行用户设置的 init 函数
    let i: any
    let data = vnode.data
    if (data !== undefined) {
      const init = data.hook?.init
      if (isDef(init)) {
        init(vnode)
        data = vnode.data
      }
    }
    const children = vnode.children
    const sel = vnode.sel
    // 把 vNode 转换成真实 DOM 对象（没有渲染到页面）
    if (sel === '!') {
      // 创建注释节点
      if (isUndef(vnode.text)) {
        vnode.text = ''
      }
      vnode.elm = api.createComment(vnode.text!)
    } else if (sel !== undefined) {
      // 如果选择器不为空
      // 解析选择器
      // Parse selector
      const hashIdx = sel.indexOf('#')
      const dotIdx = sel.indexOf('.', hashIdx)
      const hash = hashIdx > 0 ? hashIdx : sel.length
      const dot = dotIdx > 0 ? dotIdx : sel.length
      const tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel
      const elm = vnode.elm = isDef(data) && isDef(i = data.ns)
        ? api.createElementNS(i, tag)
        : api.createElement(tag)
      if (hash < dot) elm.setAttribute('id', sel.slice(hash + 1, dot))
      if (dotIdx > 0) elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '))
      // 执行所使用模块的 create 钩子函数
      for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode)
      // 如果 vNode 中有子节点，创建子 vNode 对应的 DOM 元素并追加到 DOM 树上
      if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
          const ch = children[i]
          if (ch != null) {
            api.appendChild(elm, createElm(ch as VNode, insertedVnodeQueue))
          }
        }
      } else if (is.primitive(vnode.text)) {
        api.appendChild(elm, api.createTextNode(vnode.text))
      }
      const hook = vnode.data!.hook
      if (isDef(hook)) {
        hook.create?.(emptyNode, vnode)
        if (hook.insert) {
          insertedVnodeQueue.push(vnode)
        }
      }
    } else {
      // 如果选择器为空，创建文本节点
      vnode.elm = api.createTextNode(vnode.text!)
    }
    // 返回新创建的 DOM
    return vnode.elm
  }
```

#### removeVnodes 函数

作用：从 DOM 树上批量移除 vNode 对应的 DOM 元素。

```typescript
  function removeVnodes (parentElm: Node,
    vnodes: VNode[],
    startIdx: number,
    endIdx: number): void {
    for (; startIdx <= endIdx; ++startIdx) {
      let listeners: number
      let rm: () => void
      const ch = vnodes[startIdx]
      if (ch != null) {
        if (isDef(ch.sel)) {
          invokeDestroyHook(ch)
          // 防止重复删除 DOM 元素，等待所有钩子函数全调用完成后，删除 DOM 元素
          // rm 函数会在相对应的钩子函数中被调用
          listeners = cbs.remove.length + 1
          rm = createRmCb(ch.elm!, listeners)
           for (let i = 0; i < cbs.remove.length; ++i) cbs.remove[i](ch, rm)
          const removeHook = ch?.data?.hook?.remove
          if (isDef(removeHook)) {
            removeHook(ch, rm)
          } else {
            rm()
          }
        } else { // Text node
          api.removeChild(parentElm, ch.elm!)
        }
      }
    }
  }
```

#### addVnodes 函数

作用：批量添加 vNode 对应的 DOM 元素到 DOM 树上。

```typescript
  function addVnodes (
    parentElm: Node,
    before: Node | null,
    vnodes: VNode[],
    startIdx: number,
    endIdx: number,
    insertedVnodeQueue: VNodeQueue
  ) {
    for (; startIdx <= endIdx; ++startIdx) {
      const ch = vnodes[startIdx]
      if (ch != null) {
        api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before)
      }
    }
  }
```

#### patchVnode 函数

作用：对比两个新旧两个 vNode 节点，找到之间的差异，并更新到 DOM 上。

- 触发 prepatch 钩子函数
- 触发 update 钩子函数
- 新节点有 text 属性，且不等于旧节点的 text属性
  - 如果老节点有 children，移除老节点 children 对应的 DOM 元素
  - 设置新节点对应 DOM 元素的 textContent
- 新老节点都有 children 属性，且不相等
  - 调用 updateChildren()
  - 对比子节点，并更新子节点差异
- 只用新节点有 children 属性
  - 如果老节点有 text 属性，清空对应 DOM 元素的 textContent
  - 添加所有的子节点
- 只有老节点有 children 属性
  - 移除所有老节点
- 只有老节点有 text 属性
  - 清空对应 DOM 元素的 textContent
- 触发 postpatch 钩子函数

```typescript
  function patchVnode (oldVnode: VNode, vnode: VNode, insertedVnodeQueue: VNodeQueue) {
    // 第一个过程：触发 prepatch 与 update 钩子函数
    const hook = vnode.data?.hook
    hook?.prepatch?.(oldVnode, vnode)
    const elm = vnode.elm = oldVnode.elm!
    const oldCh = oldVnode.children as VNode[]
    const ch = vnode.children as VNode[]
    if (oldVnode === vnode) return
    if (vnode.data !== undefined) {
      for (let i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
      vnode.data.hook?.update?.(oldVnode, vnode)
    }
    // 第二个过程：比对新旧 vNode 差异
    if (isUndef(vnode.text)) {
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue)
      } else if (isDef(ch)) {
        if (isDef(oldVnode.text)) api.setTextContent(elm, '')
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
      } else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1)
      } else if (isDef(oldVnode.text)) {
        api.setTextContent(elm, '')
      }
    } else if (oldVnode.text !== vnode.text) {
      if (isDef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1)
      }
      api.setTextContent(elm, vnode.text!)
    }
    // 第三个过程，触发 postpatch 钩子函数 
    hook?.postpatch?.(oldVnode, vnode)
  }
```

#### updateChildren 整体分析

- 在对开始节点与结束节点比较的时候，总共有四种情况
  - oldStartVnode / newStartVnode
  - oldEndVnode /  newEndVnode
  - oldStartVnode / newEndVnode
  - oldEndVnode / newStartVnode

- 如果新旧开始节点是 sameVnode（key 与 sel 相同）
  - 调用 patchVnode () 对比和更新节点
  - 把旧开始和新开始索引往后移动（oldStartIdx++ / newStartIdx++）
- 如果新旧结束节点是 sameVnode（key 与 sel 相同）
  - 调用 patchVnode () 对比和更新节点
  - 把旧结束和新结束索引往前移动（oldEndIdx-- / newEndIdx--）
- 如果旧开始节点与新结束节点是 sameVnode
  - 调用 patchVnode () 对比和更新节点
  - 将 oldStartVnode 对应的 DOM 元素，移动到右边，更新索引（oldStartIdx++ / newEndIdx--）
- 如果新结束节点与旧开始节点是 sameVnode
  - 调用 patchVnode () 对比和更新节点
  - 将 oldEndVnode 对应的 DOM 元素，移动到左边，更新索引（oldEndIdx-- / newStartIdx ++）
- 非以上四种情况 
  - 遍及新节点，从旧节点中查找 sameVnode
    - 找到 sameVnode，将旧 sameVnode 节点移动到指定位置
    - 未找到 sameVnode，在指定位置插入新节点

- 循环结束
  - 当老节点的所有子节点线遍历完（oldStartIdx >  oldEndIdx），循环结束
  - 当新节点的所有子节点线遍历完（newStartIdx >  newEndIdx），循环结束
- 如果老节点的数组先遍历完（oldStartIdx > oldEndIdx）
  - 说明新节点有剩余，把剩余节点批量插入到右边
- 如果新节点的数组先遍历完（newStartIdx > newEndIdx）
  - 说明旧节点有剩余，把剩余节点移除 

#### updateChildren 函数

```typescript
  function updateChildren (parentElm: Node,
    oldCh: VNode[],
    newCh: VNode[],
    insertedVnodeQueue: VNodeQueue) {
    let oldStartIdx = 0
    let newStartIdx = 0
    let oldEndIdx = oldCh.length - 1
    let oldStartVnode = oldCh[0]
    let oldEndVnode = oldCh[oldEndIdx]
    let newEndIdx = newCh.length - 1
    let newStartVnode = newCh[0]
    let newEndVnode = newCh[newEndIdx]
    let oldKeyToIdx: KeyToIndexMap | undefined
    let idxInOld: number
    let elmToMove: VNode
    let before: any
    // 同级别节点比较
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (oldStartVnode == null) {
        oldStartVnode = oldCh[++oldStartIdx] // Vnode might have been moved left
      } else if (oldEndVnode == null) {
        oldEndVnode = oldCh[--oldEndIdx]
      } else if (newStartVnode == null) {
        newStartVnode = newCh[++newStartIdx]
      } else if (newEndVnode == null) {
        newEndVnode = newCh[--newEndIdx]
        // 比较开始和结束的 4 种情况 
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue)
        oldStartVnode = oldCh[++oldStartIdx]
        newStartVnode = newCh[++newStartIdx]
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue)
        oldEndVnode = oldCh[--oldEndIdx]
        newEndVnode = newCh[--newEndIdx]
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue)
        api.insertBefore(parentElm, oldStartVnode.elm!, api.nextSibling(oldEndVnode.elm!))
        oldStartVnode = oldCh[++oldStartIdx]
        newEndVnode = newCh[--newEndIdx]
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue)
        api.insertBefore(parentElm, oldEndVnode.elm!, oldStartVnode.elm!)
        oldEndVnode = oldCh[--oldEndIdx]
        newStartVnode = newCh[++newStartIdx]
      } else {
        if (oldKeyToIdx === undefined) {
          oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
        }
        idxInOld = oldKeyToIdx[newStartVnode.key as string]
        if (isUndef(idxInOld)) { // New element
          api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm!)
        } else {
          elmToMove = oldCh[idxInOld]
          if (elmToMove.sel !== newStartVnode.sel) {
            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm!)
          } else {
            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue)
            oldCh[idxInOld] = undefined as any
            api.insertBefore(parentElm, elmToMove.elm!, oldStartVnode.elm!)
          }
        }
        newStartVnode = newCh[++newStartIdx]
      }
    }
    // 循环结束的收尾工作
    if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
      if (oldStartIdx > oldEndIdx) {
        // 老节点数组遍历完，新节点数组有剩余
        before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm
        addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue)
      } else {
        // 新节点数组遍历完，老节点数组有剩余
        removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
      }
    }
  }
```

