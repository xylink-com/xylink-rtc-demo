# XYLINK WEBRTC SDK
小鱼易连webrtc sdk demo项目。

此项目使用到的技术栈：react+typescript+hook

### dev

```bash
$ yarn

$ yarn start
```

### build
构建完成后，所有的依赖都打包到lib目录下面，可通过script或es6模块引用。

```bash
$ yarn build
```

### 备注
1. 注意在`src/component/index.tsx`中配置第三方登录所需的
  * extId
  * clientId
  * clientSecret