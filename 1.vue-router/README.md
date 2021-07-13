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
