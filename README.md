# 裂旗战争 · Shattered States

> 一款架空背景下的"美国内战"轻策略 Web 游戏。  
> 灵感取自 *Hearts of Iron IV / Kaiserredux* 的国策与意识形态体系，浓缩到一张可双击就开打的战术地图上。

<p align="center">
  <a href="#在线试玩"><img alt="play" src="https://img.shields.io/badge/play-browser-blue"></a>
  <a href="#技术栈"><img alt="vanilla" src="https://img.shields.io/badge/stack-vanilla%20JS-yellow"></a>
  <a href="#联机模式"><img alt="firebase" src="https://img.shields.io/badge/multiplayer-Firebase%20RTDB-orange"></a>
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-green"></a>
</p>

---

## 目录

- [玩法概览](#玩法概览)
- [核心特性](#核心特性)
- [在线试玩](#在线试玩)
- [本地运行](#本地运行)
- [联机模式](#联机模式)
- [操作速查](#操作速查)
- [项目结构](#项目结构)
- [开发笔记](#开发笔记)
- [致谢与许可](#致谢与许可)

---

## 玩法概览

合众国分崩离析，**8 个独立政权**——麦克阿瑟军政府、联合工团、联盟国、宪政国、新英格兰、太平洋国、西部军区、德克萨斯——在曾经的 USA 版图上互相吞并。

每个国家：

- 拥有 **独立国策树**（含 4~6 条分支、若干互斥路线、隐藏觉醒分支）。
- 拥有 **起步意识形态**（17 种之一，影响 PP 上限、维护率、攻防、征兵成本……）。
- 通过国策可以 **切换意识形态**，叠加效果即时生效（旧加成自动卸下，无需手动管理）。
- 共同争夺地图节点：节点 = 工业 + 兵力 + 标签（首都 / 港口 / 油田 / 铁路…），不同标签触发不同收入与防御加成。

胜利条件：吞并所有原始首都，或在霸权模式下攻陷指定阈值的节点。

## 核心特性

| 模块 | 简介 |
| --- | --- |
| **国策系统** | 8 国 × 平均 25 条国策，含克苏鲁觉醒、犹格-索托斯之钥、爬行混沌等隐藏分支。每条国策可堆叠 PP 推进，完成后即时生效。 |
| **意识形态** | 17 种意识形态（军政府 / 工团主义 / 民粹 / 战时民主 / 商业共和 / 神权 / 旧日支配……），每种自带一组生效中加成；切换会替换旧加成。 |
| **同时回合** | 所有国家同时规划；移动与进攻只生成可撤销的行军箭头，全部提交或计时结束后统一结算。 |
| **行动滑块** | 征兵 / 移动支持滑块批量操作；规划中的兵力会被预留，不会在结算前提前改变地图。 |
| **红警风格房间** | 每个国家一席位：空席 / 添加 AI（含难度） / 玩家入座；房主可调难度、移除 AI、踢人。 |
| **Firebase / MQTT 联机** | 通过房间码邀请好友。每个势力使用独立计划通道，房主负责统一结算并广播权威地图快照。 |
| **本地 AI** | 三档难度：简单（每回合 1 动）/ 普通（3 动）/ 困难（6 动并优先国策、抢工业）。 |

## 在线试玩

> 静态站点，可直接部署在 GitHub Pages / Vercel / Netlify。

- GitHub Pages：在仓库 `Settings → Pages` 选择 `main` 分支根目录即可，几分钟后访问  
  `https://CLRedfield.github.io/AmericaWar/`
- 本地预览见下一节。

## 本地运行

不需要 Node、不需要打包工具，纯静态资源。任意 HTTP 服务器都可：

```bash
# 克隆
git clone https://github.com/CLRedfield/AmericaWar.git
cd AmericaWar

# 任选一种方式起服务（避免 file:// 协议）
python -m http.server 8765         # Python
# 或
npx http-server -p 8765            # Node

# 浏览器打开
http://localhost:8765/
```

> 直接双击 `index.html` 也能跑大部分功能，但 Firebase 联机需要 `http(s)://` 协议才能工作。

## 联机模式

### 1. 启用 Firebase 服务（仅房主需要做一次）

仓库自带的 `firebase-config.js` 是示例配置。建议你在 [Firebase Console](https://console.firebase.google.com/) 自建一个免费项目并替换为你自己的：

```js
const firebaseConfig = {
  apiKey: "<你的 apiKey>",
  authDomain: "<你的项目>.firebaseapp.com",
  databaseURL: "https://<你的项目>-default-rtdb.<region>.firebasedatabase.app",
  projectId: "<你的项目>",
  // ...
};
```

需要在 Firebase 控制台开启：

- **Authentication → Sign-in method → Anonymous**：玩家进房自动匿名登录，无需注册。
- **Realtime Database**：选 Asia (Singapore) 或就近区域。

### 2. 安全规则（推荐）

打开 RTDB 的 Rules 标签，粘贴：

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read":  "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

匿名登录后即可读写，挡住直接拿 apiKey 暴力写库的脚本。

### 3. 开始游戏

1. 主菜单输入昵称 → **创建联机房间**，得到 6 位房间码（如 `UGQYB4`）。
2. 朋友打开同一站点 → **通过房间码加入**，输入房间码即可。  
   也可以点房主页面上的"复制邀请链接"分享 `https://站点/#room=UGQYB4`，对方打开自动弹加入对话。
3. 房主在席位面板里：
   - 给空席添加 AI 并选择难度
   - 把人类玩家踢出（"踢出" 按钮）
   - 调整 AI 难度（下拉切换）
4. 至少 1 名人类 + 共 2 个非空席位时，**开始游戏** 才会亮起。
5. 开局后所有玩家同时规划。回合按钮直接显示真人玩家的 **已准备 x/n**；点 **准备完毕** 后本方操作锁定，其他人尚未准备时可再点 **取消准备** 恢复操作。

### 4. 同时回合如何结算

1. **规划**：征兵、裁军、建设与国策先写入本势力草案；移动和进攻只预留兵力并画出箭头，不立刻改地图。
2. **提交**：每个势力单独上传计划。AI 由房主在同一阶段生成国策、经济与移动计划，并自动提交。
3. **锁定**：全部存活势力提交后立刻结算；倒计时归零时，未提交势力按当前草案提交，没有草案则原地待命。
4. **统一移动**：先按回合开始时的占领关系校验命令，再同时从所有出发节点扣兵，避免先点击的人获得时序优势。
5. **统一战斗与围攻**：所有进入同一目标的兵力按势力合并。不同出发节点才算不同进攻方向：1 路无额外加成，2 路进攻 +5%，3 路及以上 +10%（封顶）；把同一节点拆成多道命令不会重复计数。原控制方获得 15% 基础防御，国策/意识形态攻防修正继续生效；最高战力势力占领节点，平局优先原控制方。
6. **空节点**：移动、进攻、裁军和赤字逃兵都可以让己方节点降到 0 兵；空节点仍由原势力控制，但敌军进入时会在统一结算中直接完成无守军占领。
7. **回合末经济**：战斗结束后统一结算所有人类与 AI 的收入、维护、PP、首都补员和赤字逃兵，然后恢复部队可移动状态，进入下一轮规划。
8. **结算回放**：权威端广播通过校验的公开行军命令和每个目标的胜方摘要；各客户端在地图上并行播放兵力沿路线推进，并在抵达后分别显示交战或占领反馈。回放不参与规则计算，也不会阻塞下一轮同步。

联机权威规则：

- 客户端只写自己势力的计划，不再上传整张地图，避免多人同时操作时互相覆盖。
- 房主合并计划、执行结算并广播唯一地图快照。
- 国策产生的 `factionNames`（国名与简称）会随本势力计划即时公开刷新，并包含在房主权威快照中兜底，因此其他玩家无需等到结算后才看到改名。

## 操作速查

| 入口 | 说明 |
| --- | --- |
| 主菜单 | 昵称、单机沙盒、创建/加入联机房间 |
| 房间界面 | 国家席位（空 / AI / 玩家）、房主设置、聊天 |
| 战场顶栏 | 当前回合、规划/结算阶段、真人已准备 x/n、PP / 金钱、准备完毕或取消准备 |
| 节点面板 | 选中节点查看工业、兵力、可动老兵；右栏行动按钮 |
| 国策树 | 缩放 + 拖拽，互斥路线高亮，进度可视化 |
| 战报标签 | 战斗 / 系统 / 聊天 / 外交，分流不同事件 |

征兵动作支持滑块（每兵 $2，按当前 PP / 金钱上限自动 clamp，可一键 Max）。

## 项目结构

```
AmericaWar/
├── index.html                 入口（按顺序加载所有脚本）
├── firebase-config.js         Firebase 客户端配置 + 匿名登录引导
├── css/
│   ├── design-system.css      色板、字号、间距、组件原子样式
│   └── app.css                布局、地图、面板、动效
├── js/
│   ├── state.js               GameState 单例（回合 / 资源 / 意识形态 / lobby）
│   ├── focus-trees.js         8 国国策树定义（含 KX 风格觉醒分支）
│   ├── map.js                 节点 / 阵营 / 邻接关系 / 战斗判定
│   ├── simultaneous-turns.js  同时规划 / 命令预留 / 回合末统一结算
│   ├── ai.js                  本地 AI（三档难度，房主代跑）
│   ├── multiplayer.js         Firebase RTDB 房间同步（lobby + game state）
│   ├── app.js                 路由、行动调度、轮转、UI 事件入口
│   └── views/
│       ├── main-menu.js       主菜单
│       ├── lobby.js           红警风格席位面板
│       ├── faction-select.js  单人快速选阵营
│       └── game-page.js       战场视图（地图 / 面板 / 国策模态）
├── kx_*.md / kx_*.json        国策与效果设计参考文档
└── README.md
```

## 开发笔记

- **零构建**：所有 JS 文件按 `index.html` 中的 `<script>` 顺序加载到全局，互相通过 `window.GameState`、`window.MapData` 等对象通信。
- **状态驱动 UI**：所有渲染来自 `GameState.notify()` → `App.render()`，只需修改状态对象、自动刷新对应面板。
- **同时回合**：`SimultaneousTurns` 保存逐势力草案、预留出发兵力，并按目标节点分组统一结算；`App.endTurn()` 在新模式下表示准备完毕/取消准备。
- **AI 与回合**：房主每轮只为 AI 生成一次国策/经济动作和移动计划，AI 计划自动提交，不再占用独立的可见行动回合。
- **联机一致性**：人类玩家只写入自己的 `plans/{factionId}`；真人准备人数和公开国名随计划通道刷新，只有房主在统一结算后写完整 `state`。`factionNames`、`humanStates` 和回合阶段仍随权威快照同步兜底。
- **意识形态加成**：通过专门 getter（`getEffectivePPCap` / `getEffectiveCaptureMoney` / `getCapitalTroopsPerTurn`…）动态求和，切换意识形态无需手动卸载旧 modifier。

## 致谢与许可

- 国策与意识形态系统的灵感大量取自 *Hearts of Iron IV* 与 *Kaiserredux* 模组社区。
- 地图坐标、节点标签为本作原创，所有内容仅供学习交流。
- 代码基于 [MIT License](LICENSE) 发布；游戏中涉及的真实人名、机构、品牌均为戏剧化处理。

---

> 有 bug 或想法欢迎在 Issues 提出。  
> If you build something cool with this codebase, drop a link!
