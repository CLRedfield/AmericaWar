# 裂旗战争 · Shattered States

> 一款架空背景的轻策略网页游戏，包含美国内战与西俄罗斯大动乱两场战役。
> 国策、意识形态和开局势力分别参考《钢铁雄心 IV》的 Kaiserredux 与 The New Order。

<p align="center">
  <a href="#在线试玩"><img alt="play" src="https://img.shields.io/badge/play-browser-blue"></a>
  <a href="#技术栈"><img alt="vanilla" src="https://img.shields.io/badge/stack-vanilla%20JS-yellow"></a>
  <a href="#联机模式"><img alt="firebase" src="https://img.shields.io/badge/multiplayer-Firebase%20RTDB-orange"></a>
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-green"></a>
</p>

---

## 目录

- [玩法概览](#玩法概览)
- [战役地图](#战役地图)
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

在主菜单选战役与每回合时间，再开单机或创建联机房间。两张地图都支持 30、60、90、120、180、300 秒和不限时。房主也可以在开局前改时长。各势力同时规划征兵、建设、国策和行军，统一在回合末结算。

| 战役 | 可玩势力 | 可占领省区 | 每势力国策 |
| --- | ---: | ---: | ---: |
| 美国内战 | 8 | 48 | 145–150 项 |
| 西俄罗斯 · 大动乱 | 11 | 93 | 151–168 项 |

各势力有独立国策树与起步意识形态，完成政治路线可切换加成并改换国号。省区拥有工业、驻军和地形标签，调兵和进攻沿省区共边进行。统一模式要求击败其他势力，霸权模式也可通过控制 60% 的省区取胜。

## 战役地图

### 美国内战

地图覆盖美国本土 48 州及华盛顿特区。真实县界按城市中心合并成 48 个游戏省区。占领会改变整个省区的颜色和前线。州内细分以县界近似表达。

开局参考《钢铁雄心 IV》模组 [Kaiserredux 的内战阵营脚本](https://github.com/JoeBidenWhatAreYouHiding/kx/blob/681c3972e66d6ebf39000b43a643116798207492/common/scripted_effects/American_Civil_War_scripted_effects.txt)，并选用[德州独立、保住外佩科斯](https://github.com/JoeBidenWhatAreYouHiding/kx/blob/681c3972e66d6ebf39000b43a643116798207492/events/Texas.txt)的分支。纽约市归联合工团，纽约上州归新英格兰。省区粒度和首都采用本作自己的剧本设定。

| 阵营 | 开局地盘 |
| --- | --- |
| 麦克阿瑟军政府 | 华盛顿、马里兰、特拉华、弗吉尼亚大部、南新泽西及北卡罗来纳部分海岸 |
| 联合工团 | 五大湖工业带、宾夕法尼亚、北新泽西、纽约市及长岛，另有德卢斯一带 |
| 联盟国 | 大平原、密西西比河上游部分地区、明尼苏达大部与路易斯安那 |
| 宪政国 | 东南各州，及密苏里、弗吉尼亚、西弗吉尼亚等州部分地区 |
| 新英格兰 | 新英格兰六州与纽约上州 |
| 太平洋国 | 华盛顿州、俄勒冈、加利福尼亚与内华达部分西部县 |
| 西部军区 | 落基山地区与西南内陆 |
| 德克萨斯 | 德克萨斯州，包括外佩科斯、达拉斯和休斯敦 |

### 西俄罗斯 · 大动乱

开局采用 TNO 经典西俄势力的国名和大致占领范围。地图将 494 个相邻的真实区县合并成 93 个可占领省区，势力边界也沿真实区县边界落位。普列谢茨克、乌赫塔作为革命阵线辖区上图。莫斯科专员辖区、沃尔库塔和奥伦堡公社是战区外背景。[西俄势力](https://tno.wiki.gg/wiki/Russia/Situation) · [1962 年地图参考](https://www.paxhistoria.co/assets/ea71e561-16fe-57fb-962c-47e2e1bf8a5c)

| 势力 | 首都 | 起始省区 | 国策重点 |
| --- | --- | ---: | --- |
| 西俄罗斯革命阵线 | 阿尔汉格尔斯克 | 14 | 元帅继承、白海船坞、北线军运、冬林阻击与突击梯队 |
| 科米共和国 | 瑟克特夫卡尔 | 7 | 议会党团、工厂代表、电网与科研。中间联盟有三种施政结局，右派有四种 |
| 维亚特卡总督辖区 | 维亚特卡 | 10 | 王冠预算、地方杜马、白军参谋、乌德穆尔特兵工 |
| 俄罗斯解放军 | 萨马拉 | 12 | 继任听证、公开采购或承包融资、油料军列与跨岸机动 |
| 雅利安兄弟会 | 彼尔姆 | 10 | 旧政权内部分裂、工人互助与复权、卡马电网 |
| 反共志愿卫队 | 奥涅加 | 3 | 芬兰外援或本地筹资、海岸机动或三镇纵深防御 |
| 高尔基军事管制委员会 | 高尔基 | 5 | 汽车厂复产、装甲攻坚或反击连、伏尔加渡口 |
| 沃洛格达中立国 | 沃洛格达 | 11 | 过境公约、救援专列、合作社信用、武装中立 |
| 圣乔治骑士团 | 盖内 | 6 | 堂区救济、民事法庭、上卡马航运与山口护卫 |
| 鞑靼斯坦共和国 | 喀山 | 8 | 多语公民权、油田分成、卡马航运、地方协约 |
| 巴什科尔托斯坦共和国 | 乌法 | 7 | 油田留成或集中炼油、种粮合作、山口守备或机动纵队 |

前 3 回合为发育期，可建设、征兵、推进早期国策和境内调兵。第 4 回合进入大动乱，开放跨境进攻与战时国策。各国有 14–16 个支线板块，开局项目、政治分叉、跨支线前置和战役目标因国而异。部分战役国策要求控制特定省区，部分政治路线会在选定继任者后才关闭另一条路线。20 种意识形态提供不同的财政、政治与攻防修正。[大动乱机制](https://tno.wiki.gg/wiki/Smuta) · [科米路线参考](https://tno.wiki.gg/wiki/Komi_Republic/Gameplay)

在房间勾选「启用剧情」后，开局简报、势力故事、国策事件和终章会进入剧情档案，可随时回看。文案为根据 TNO 背景创作的中文故事，阅读过程与回合计时独立。

## 核心特性

| 模块 | 简介 |
| --- | --- |
| **国策系统** | 各势力都有独立的国策树与互斥路线。每条国策可投入 PP 推进，完成后即时生效。 |
| **意识形态** | 美国战役有 17 种意识形态，西俄战役有 20 种。每种自带一组持续修正，切换时自动替换。 |
| **同时回合** | 所有国家同时规划；移动与进攻只生成可撤销的行军箭头，全部提交或计时结束后统一结算。 |
| **战区地图** | 政区、工业热力图和省区列表。整块省区可点选，势力边界随结算更新。 |
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

美国内战沿用六码房间码，西俄罗斯房间码带 `WR-` 前缀。加入时会根据房间码选择战役。西俄国策树更新后，请使用新版新建房间。

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

1. 主菜单选战役并输入昵称，点 **创建联机房间**。房间码形如 `UGQYB4` 或 `WR-UGQYB4`。
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
| 主菜单 | 战役、每回合时间、昵称、单机沙盒、创建或加入联机房间 |
| 房间界面 | 国家席位（空 / AI / 玩家）、回合时长等房主设置、聊天 |
| 战场顶栏 | 当前回合、规划/结算阶段、真人已准备 x/n、PP / 金钱（点击可直开国家修正明细）、准备完毕或取消准备 |
| 地图 | 点省区查看详情，拖动平移，滚轮或双指缩放，「首都」定位己方首都，「全图」恢复总览 |
| 下达行军令 | 选中己方省区可点「行军/进攻」配合地图顶部行军横幅选目标（电脑亦支持右键接壤目标）；直接点选接壤敌省也可一键「从邻省出击」 |
| 行动与预设 | 征兵、裁军、行军与进攻均提供 `1支 / 半数 / 留1守军 / 全部` 等一键预设芯片；手机端选中省区自动浮现双行战术操作条 |
| 国策树 | 缩放、拖拽、分支定位与前置跳转。手机端详情抽屉默认折叠让出画布视野，可随时一键展开/收起；底部 5 栏导航（地图 / 行动 / 国策 / 情报 / 战报）直达各面板 |
| 战报标签 | 战斗 / 系统 / 聊天 / 外交，分流不同事件 |

征兵动作支持滑块与快捷预设芯片（每兵 $2，按当前 PP / 金钱上限自动 clamp，可一键满额）。

## 项目结构

```
AmericaWar/
├── index.html                 入口（按顺序加载所有脚本）
├── firebase-config.js         Firebase 客户端配置 + 匿名登录引导
├── css/
│   ├── design-system.css      色板、字号、间距、组件原子样式
│   └── app.css                布局、地图、面板、移动端响应式与动效
├── js/
│   ├── state.js               GameState 单例（回合 / 资源 / 意识形态 / lobby）
│   ├── focus-trees.js         美国 8 国国策树聚合入口
│   ├── focus-trees/data/      美国各阵营独立国策树定义
│   ├── province-geography.js  生成的省区形状、共边与开局归属
│   ├── scenarios/             西俄势力、剧情、国策与生成的地图
│   ├── map.js                 省区数据、邻接关系与地图渲染
│   ├── simultaneous-turns.js  同时规划 / 命令预留 / 回合末统一结算
│   ├── ai.js                  本地 AI（三档难度，房主代跑）
│   ├── multiplayer.js         Firebase RTDB 房间同步（lobby + game state）
│   ├── app.js                 路由、行动调度、轮转、UI 事件入口
│   └── views/
│       ├── main-menu.js       主菜单
│       ├── lobby.js           红警风格席位面板
│       ├── faction-select.js  单人快速选阵营
│       └── game-page.js       战场视图（地图 / 面板 / 手机战术栏 / 国策模态）
├── tests/                     Node 单元回归测试与 Playwright 浏览器验收脚本
├── tools/build-provinces.py        从公开县界数据重建美国地图
├── tools/build-west-russia-map.py  合并真实区县边界并重建西俄地图
└── README.md
```

## 开发笔记

- **零构建**：所有 JS 文件按 `index.html` 中的 `<script>` 顺序加载到全局，互相通过 `window.GameState`、`window.MapData` 等对象通信。
- **状态驱动 UI**：所有渲染来自 `GameState.notify()` → `App.render()`，只需修改状态对象、自动刷新对应面板。
- **同时回合**：`SimultaneousTurns` 保存逐势力草案、预留出发兵力，并按目标节点分组统一结算；`App.endTurn()` 在新模式下表示准备完毕/取消准备。
- **AI 与回合**：房主每轮只为 AI 生成一次国策/经济动作和移动计划，AI 计划自动提交，不再占用独立的可见行动回合。
- **联机一致性**：人类玩家只写入自己的 `plans/{factionId}`；真人准备人数和公开国名随计划通道刷新，只有房主在统一结算后写完整 `state`。`factionNames`、`humanStates` 和回合阶段仍随权威快照同步兜底。
- **意识形态加成**：通过专门 getter（`getEffectivePPCap` / `getEffectiveCaptureMoney` / `getCapitalTroopsPerTurn`…）动态求和，切换意识形态无需手动卸载旧 modifier。
- **回归测试**使用 `node --test tests/*.test.js`，覆盖西俄地图邻接、国策依赖、发育期规则、剧情设置、意识形态切换与联机同步。
- **西俄国策数据**在 `js/scenarios/west-russia-programs.js` 定义各国项目与政治前置，`west-russia-focus.js` 编译国策节点与互斥关系，`west-russia-focus-layout.js` 按全部前置分层，并在行列间的空隙为国策连线。测试遍历各国依赖，确认每个节点至少有一条与互斥规则相容的路线。

## 致谢与许可

- 国策与意识形态系统的灵感大量取自 *Hearts of Iron IV* 与 *Kaiserredux* 模组社区。
- 地理数据来自美国人口普查局 2017 年制图边界，使用 [us-atlas 3.0.1](https://github.com/topojson/us-atlas) 的 Albers 投影县界数据。上游 [ISC 许可](tools/us-atlas-LICENSE.txt) 随仓库保留。游戏加载本地生成的几何文件。
- 重建美国地图时，运行 `python tools/build-provinces.py counties-albers-10m.json --rivers ne_10m_rivers_lake_centerlines.shp`。[美国县界](https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/counties-albers-10m.json)
- 西俄区县边界来自 © OpenStreetMap contributors，由 geoBoundaries 整理。简化数据用于划分开局省区，完整数据用于细绘同一批区县。区县数据及其衍生几何按 ODbL 1.0 提供。[geoBoundaries RUS ADM2](https://www.geoboundaries.org/api/current/gbOpen/RUS/ADM2/) · [简化 GeoJSON](https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/RUS/ADM2/geoBoundaries-RUS-ADM2_simplified.geojson) · [完整 GeoJSON](https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/RUS/ADM2/geoBoundaries-RUS-ADM2.geojson) · [OpenStreetMap 版权](https://www.openstreetmap.org/copyright) · [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)
- 地图背景和水系使用 Natural Earth 公有领域数据。重建西俄时运行 `python tools/build-west-russia-map.py admin.shp rivers.shp raions-simplified.geojson --detailed-raions raions-full.geojson --lakes lakes.shp`，将参数替换为各数据文件路径。[带湖泊的行政区](https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces_lakes.zip) · [河流中心线](https://naciscdn.org/naturalearth/10m/physical/ne_10m_rivers_lake_centerlines.zip) · [湖泊](https://naciscdn.org/naturalearth/10m/physical/ne_10m_lakes.zip) · [Natural Earth 使用条款](https://www.naturalearthdata.com/about/terms-of-use/)
- 代码基于 [MIT License](LICENSE) 发布；游戏中涉及的真实人名、机构、品牌均为戏剧化处理。

```bash
python -m pip install 'shapely==2.1.2' 'pyproj==3.7.2' 'pyshp==2.3.1'
python tools/build-west-russia-map.py \
  /path/to/ne_10m_admin_1_states_provinces_lakes.shp \
  /path/to/ne_10m_rivers_lake_centerlines.shp \
  /path/to/geoBoundaries-RUS-ADM2_simplified.geojson
```

---

> 有 bug 或想法欢迎在 Issues 提出。  
> If you build something cool with this codebase, drop a link!
