# 西俄国策树：浏览器验收与视觉回归

测试位于 `tests/browser`，与游戏本身的静态运行依赖分开。默认使用一个全新的 Chromium 测试上下文，通过 HTTP 启动本地沙盒；不连接已打开的浏览器、调试端口或用户会话，也不读写线上房间。

## 安装和执行

需要 Node.js 20 或更新版本。下面命令可在 Windows PowerShell、macOS 或 Linux 终端执行：

```sh
cd tests/browser
npm ci
npx playwright install chromium
npm test
```

Linux CI 若缺少 Chromium 系统依赖，可在允许安装系统软件的环境使用 `npx playwright install --with-deps chromium`。截图环境还需要中文字体，例如 Noto Sans CJK；请在建立基线前装好字体，之后保持操作系统、字体、Playwright 版本和浏览器一致。

如果环境已有 Chromium，但无法取得 Playwright 对应的浏览器包，可通过 `FOCUS_BROWSER_EXECUTABLE` 指定已有可执行文件。例如 Linux：

```sh
FOCUS_BROWSER_EXECUTABLE=/usr/bin/chromium npm test -- --label after
```

Windows PowerShell 可分别执行 `$env:FOCUS_BROWSER_EXECUTABLE = 'C:\path\to\chrome.exe'` 和 `npm test -- --label after`。此选项仍然启动全新的独立测试进程，不连接用户已打开的浏览器或会话。每项测试会将实际 `browser.version()`、可执行文件选择和视口写入报告的 `browser-environment` 附件。

系统浏览器与 Playwright 配套版本可能存在行为或截图差异。正式 CI 和像素基线优先使用锁定 Playwright 版本随附的 Chromium；若用系统浏览器比较前后版本，两次必须使用同一可执行文件、同一版本与同一字体环境，不能混用基线。

`npm test` 会启动仅监听 `127.0.0.1:8766` 的测试服务器，运行语义与交互断言，并保存真实截图。它不会自动把截图认定为视觉合格，也不会更新黄金截图。

查看结果：

```sh
npx playwright show-report artifacts/current/report
```

截图、几何与交互 JSON、失败 trace 均附在 HTML 报告中。`artifacts/` 不入库。保持默认 `retries: 0`，避免重试掩盖偶现交互问题。

## 为修复前后保存可比截图

先在仓库根目录建立只读基线工作区，例如：

```sh
git worktree add --detach ../AmericaWar-before acfcb56d16871ba96a8e3af1c2008bfc60b59f54
cd tests/browser
npm run capture -- --root ../../../AmericaWar-before --label before
npm test -- --label after
```

`--root` 相对运行命令时的目录解析；也可以传绝对路径。基线与补丁都由同一套测试、同一浏览器和同一视口访问，避免把环境差异当成修复效果。

**capture 模式只是记录模式。** 它会保留通常的导航、几何和缩放断言，但不要求旧代码已具备新增的互斥标记，也不把全局图 resize 适配作为通过门槛。这几个状态仍会截图并写入 JSON，供前后比较。不能用 capture 成功替代验收通过。

也可以检查已有的 HTTP(S) 预览地址，不启动本地服务器：

```sh
npm run capture -- --base-url https://clredfield.github.io/AmericaWar/ --label published
```

地址必须以目录结尾，例如 `/AmericaWar/`。线上截图不保证与某个提交一致，应另外核对部署源码。所有模式均拒绝 `file:` 地址。

## 建立和使用像素基线

首次先执行 `npm test`，打开报告人工检查，确认截图可作为期望画面。随后：

```sh
npm run visual -- --update-snapshots
```

检查 `tests/browser/snapshots/` 的全部新增图片后，将被认可的基线随代码一起提交。日常回归运行：

```sh
npm run visual
```

这会在交互断言之外执行 `toHaveScreenshot` 比较。出现差异时先看 expected / actual / diff，不要直接用 `--update-snapshots` 消除失败。每个平台使用独立基线；本次固定视口为 **1363 × 936、DPR 1**，并单独保存 **1100 × 800** 的全局图。

Playwright 的截图比较与测试服务器配置分别遵循官方说明：[Visual comparisons](https://playwright.dev/docs/test-snapshots)、[Web server](https://playwright.dev/docs/test-webserver)。

## 自动覆盖范围

| 检查 | 方法与通过条件 |
| --- | --- |
| 代表势力 | WRF 革命阵线 154 项、KOM 科米 168 项、SAM 萨马拉 159 项；每次从主菜单自然开不限时本地房间 |
| 完整树 | 卡片数量符合当前数据；实际 DOM 包围盒不相交；SVG 前置连线端点对齐真实卡片上下缘 |
| 全局图 | 全部节点呈现；点击对应政治支线入口后退出概览，选中正确节点且节点处于视口内 |
| 单支线 | 卡片只属于一个支线；不残留跨支线 SVG 前置路径；实际卡片和连接端点仍对齐 |
| 跨支线跳转 | 从详情点前置，自动切到目标支线并定位；再由“跨支线后续”返回，选中项、详情和下拉菜单一致 |
| 科米四选一 | 四候选在完整树、单支线中均属于同一个互斥组；选中其一时另外三项明确标记；保存两种视图截图 |
| 跨支线互斥 | 革命阵线的参谋传承与朱可夫战时路线互斥标记正确，详情跳转可往返 |
| 按钮缩放 | 放大后真实 CSS 变换增加，缩小后恢复相同缩放 |
| 滚轮缩放 | 指针对应的内容坐标保持，允许不超过 2 CSS px 的舍入误差 |
| 选择重绘 | 点选已在视口内的卡片后滚动位置保持，允许 1 CSS px 舍入 |
| 背景拖动 | 用真实鼠标 down / move / up 在空白处拖动；横纵滚动位置都随拖动改变 |
| 全局图 resize | 从默认视口缩到 1100 × 800 后，每个概览节点仍完整位于滚动视口内 |
| 缩小后的空白 | 滚动总范围不大于实际缩放后画布与可见区域的最大值加 2 px，避免保留未缩放空间 |

`capture`、`verify` 和 `compare` 会输出相同命名的关键画面，方便把前后报告对应起来。套件不推进国策或回合，不改变前置与互斥数据，不注入游戏状态或修改页面样式。

## 人工验收仍需检查什么

自动测试能检查“画了、对齐、可点击、跳到正确位置”，不能替代以下视觉判断：

1. 在默认 82% 缩放下，普通字号是否舒适、连续链是否容易追踪。
2. 科米四候选是否一眼看成四选一，而非两组二选一；跨支线冲突在详情与树上是否有一致语义。
3. 全树较长的跨支线前置线被选中后是否容易追踪，是否被其他线路干扰。
4. 全局图不同势力的树形轮廓是否有辨识度，入口是否容易定位。
5. 连线与新增互斥标记是否抢占层级，卡片阴影、长标题、边缘裁切是否自然。

推荐先以科米右派四候选检查关系表达，再用革命阵线的嵌套继承和萨马拉的任选前置确认没有把不同的规则画成相同含义。通过后应在报告中分别写明“自动通过”和“人工认可”的范围。

## 本次执行记录（2026-11-10）

| 验证部分 | 本次状态 |
| --- | --- |
| 源码回归 | 27/27 通过：原有 17 项、互斥渲染 6 项、全局图 ResizeObserver 行为 4 项；原版代码的负对照能复现互斥断言与 resize 适配失败 |
| 上线版本实测 | 已在真实浏览器检查 WRF、KOM、SAM 三个代表势力，并保存上线版本的实际截图 |
| 浏览器套件准备 | 脚本语法检查与测试发现成功，共 7 项浏览器测试 |
| 本地浏览器执行 | 配套浏览器下载未成功；改用已有系统 Chromium 后，执行环境禁止浏览器启动。7 项均在创建页面之前中断，没有加载游戏 |
| 修复版视觉结论 | 尚未完成修复版浏览器验收，也没有修复后的实际截图；不能称“7 项浏览器测试通过”或“视觉修复已验收通过” |

源码测试通过不等于视觉验收通过。当前报告中的实际浏览器截图来自上线版本，修复后的观感仍需在允许启动 Chromium 的开发机或 CI 按上面的步骤复验。不要把静态示意图、代码推断或 capture 记录模式的结果作为修复后的实际浏览器证据。

本次已停止额外的浏览器启动尝试。后续应使用正常可用的本地 HTTP 与独立测试环境，不应绕过浏览器的 URL、文件访问或执行权限限制。
