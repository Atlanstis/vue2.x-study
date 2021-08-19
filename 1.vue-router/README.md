# vue-router

## Hash 模式与 History 模式

### Hash

表象上，url 上存在 /#/ 形式，例如：https://www.xxx.com/#/detail?id=213

#### 原理

Hash 模式是基于锚点，以及 onhashchange 事件

- URL 中 # 后面的内容作为路径地址
- 监听 hashchange 事件
- 根据当前路由地址找到对应组件重新渲染

###  History

表象上，url 与正常模式相同，但需服务器支持，例如：https://www.xxx.com/detail?id=213

#### 原理

History 模式是基于 HTML5 的 History API - history.pushState() （// IE10 以后支持） 和 history.replaceState()

- 通过 history.pushState() 方法改变地址栏
- 监听 popstate 事件
- 根据当前路由地址找到对应组件重新渲染

#### 使用

- History 模式需要服务器的支持
- 单页应用中，服务器不存在 https://www.xxx.com/detail 这样的地址时会返回找不到该页面
- 在服务器端应该除了静态资源外都返回单页应用的 index.html

## 模拟实现

Vue-router 首先是一个类，拥有以下方法及属性。

### static 方法 install

该方法供 Vue.use() 时被调用。接受两个参数，第一个参数为 Vue 对象，第二个参数为可选的配置参数。

该方法主要实现三件事情：

1. 判断当前插件是否已经被安装
2. 把 Vue 构造函数记录到全局变量
3. 把创建 Vue 实例时传入的 router 对象注入到 Vue 实例上

### 构造器

构造函数接受一个参数 options，内容为路由规则。在构造中，初始化三个成员属性，分别存储传入的 options，之后用于存储路由规则的 routeMap，以及记录当前路由位置的 data，并通过 Vue.observable 方法创建为响应式对象。

```js
let _Vue = null;
export default class VueRouter {
  // ...
  constructor(options) {
    this.options = options;
    // 之后解析路由规则，并以键值对形式保存
    this.routeMap = {};
    // 记录当前路由，并通过 Vue.observable 穿件一个响应式对象
    this.data = _Vue.observable({
      current: "/"
    });
  }
}
```

### createRouteMap

createRouteMap 方法用于将构造器中，传入的 options 解析相应的路由规则，并存入 routeMap 中。当路由发生变化后，我们就可以通过 routeMap 找到相应的组件，并进行渲染。

```js
export default class VueRouter {
  // ...
  createRouteMap() {
    // 遍历所有的路由规则，把路由规则解析成键值对的形式，存储到 routeMap 中
    const routes = this.options;
    if (Array.isArray(routes)) {
      routes.forEach(route => {
        this.routeMap[route.path] = route.component;
      });
    }
  }
}
```

### initComponents

通过 initComponents 方法，创建 router-link 与 router-view 两个组件。

#### router-link

router-link 我们可通过 render 函数的方式简单渲染为一个 a 标签的形式。

```js
Vue.component('router-link', {
  props: {
    to: String
  },
  render (h) {
    return h(
      'a',
      {
        attrs: {
          href: this.to
        },
        on: {
          click: this.onClick
        }
      },
      [this.$slots.default]
    )
  },
  methods: {
    onClick (e) {
      // 阻止 a 标签默认跳转行为，调用浏览器对应的方法改变 url 地址
      history.pushState({}, '', this.to)
      // 更改响应式对象的值，触发页面自动更新
      this.$router.data.current = this.to
      e.preventDefault()
    }
  }
})
```

#### router-view

通过注册时，生成的路由映射规则，获取渲染的组件，并渲染。

```js
const _this = this
Vue.component('router-view', {
  render (h) {
    const { routeMap, data } = _this
    // 获取渲染的组件，同时会随着响应式对象的值发生变化而变化
    const component = routeMap[data.current]
    return h(component)
  }
})
```

### initEvent

监听浏览器地址，当其发生变化时，更改渲染组件。（处理浏览器前进后退）

```js
export default class VueRouter {
  // ...
  initEvent () {
    window.addEventListener('popstate', () => {
      this.data.current = window.location.pathname
    })
  }
}
```

