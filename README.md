## 背景

公司低代码项目，对于设计器画布拖拽组件的情况，产品提出的极限测试的需求，场景下需要支持最大 50 个图层，每个图层最多 400 个组件。

不考虑这种需求合不合理，第一要务从技术角度去解决（懒得扯皮...）

那对于测试同事来说，手动拖拽组件达到极限测试的要求，无疑是不人性的，那人性的考虑就是，模拟场景数据的工作落在前端的头上。

目前低代码组件一共 62 个，挨个拖一遍到画布中，最终生成的场景 JSON 数据有存储在本地，从 LocalStorage 中取到这份 JSON，通过一个脚本，循环 50 个图层，每个图层中组件数据循环复制，超出 400 个结束，最终数据生成一份 JSON 文件。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6defd94bbed24de687b87f1c8ab2d395~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=405&h=563&s=24169&e=png&b=f9f9f9)

那之前将场景数据存储到 LocalStorage 以供预览使用，这样的数据量就不支持了。

## indexedDB

IndexedDB 是一个事务型数据库系统。参考 MDN，[戳这里](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API)，可以详细学习，这里默认各位已经了解，是想着找一篇可以快速入手的教程。

## dexie.js

原生 indexedDB 操作起来稍显复杂，indexedDB 的第三方库我采用了 dexie。

详细了解 dexie，参考官网，[戳这里](https://dexie.org/)

那其实对于数据库，想愉快简单的使用需求也就是如何增删改查。

新建一个 db.js，基于 dexie 封装一个类。

### 初始化数据库

```js
import Dexie from "dexie";
export class lowCodeDB extends Dexie {
  constructor() {
    super("previewData");
    this.version(1).stores({
      scenes: "++id, code, data",
    });
  }
}
export const db = new lowCodeDB();
```

新建一个 previewData 的数据库，一张 scenes 的表，自增的 id 字段，code 和 data 字段是根据自己业务定义，我这儿设计器中场景数据用来预览使用，code 是预览是生成的唯一值，data 里存放场景 JSON 数据。

本地的 IndexedDB 就会如下这样生成：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1b11232a8ec140d9963431caf96a8d01~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=245&h=158&s=6008&e=png&b=ffffff)

### 查询

```js
export class lowCodeDB extends Dexie {
  ...
  async query_code(code) {
    const res = await this.scenes
      .where("code")
      .equalsIgnoreCase(code)
      .toArray();
    return res[0];
  }
}
```

依据唯一值 code 查询数据，where 条件查询 code 字段，传入需要查询的 code，最终以数组形式返回。

**使用**

```js
import { db } from "./db";
async function getItem() {
  const res = await db.query_code("previewCode1");
  console.log("默认已存在code为previewCode1的数据，新增会在下面讲到", res);
}
```

### 更新

```js
  async update(code, params) {
    const { id } = await this.query_code(code);
    await this.scenes.put({ id, ...params });
  }
```

`id`是 dexie 自身更新 api 需要的参数，它是根据自增 id 字段进行查询，但我业务上其实并不涉及到这个`id`，我需要的是 code，因为这样封装方便传入 code 更新。

**使用**

```js
function update() {
  db.update("previewCode1", {
    code: "previewCode2",
    data: JSON.stringify({ id: 1, pageType: true, list: [{ name: 1111 }] }),
  });
}
```

### 新增

```js
  async add(params) {
    const { code } = params;
    const targetItem = await this.query_code(code);
    if (targetItem) {
      this.update(targetItem.code, params);
    } else {
      await this.scenes.add(params);
    }
  }
```

新增数据中 code 已存在就走更新逻辑，否则就是追加一条新数据。

**使用**

```js
function add() {
  db.add({
    code: "previewCode1",
    data: JSON.stringify({ id: 1, pageType: true, list: [{ name: 1111 }] }),
  });
}
```

### 删除

```js
  async delete(code) {
    const { id } = await this.query_code(code);
    await this.scenes.delete(id);
  }
```

和更新一样的考虑，需要通过 code 来进行删除。

**使用**

```js
function delItem() {
  db.delete("previewCode1");
}
```

## 最后

完整代码地址，`src/db.js`
