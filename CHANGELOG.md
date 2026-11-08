# 更新日志

本项目按 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 的结构维护更新记录，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。每次发布把改动归类到「新增 / 变更 / 修复」下；尚未发布的改动暂存在 `[Unreleased]`，发版时再挪到对应的版本号。

## [Unreleased]

## [0.3.3] - 2026-11-08

### Added

- CI 改为 `ubuntu-latest` / `macos-latest` / `windows-latest` 三平台矩阵，同一套 Host + Client 测试都跑。
- Windows 下 board 写入在目标文件被杀毒 / 索引器短暂占用时先重试，仍失败则退化为复制覆盖，避免看板整体写不进去。

### Changed

- README 补充跨平台说明、Windows 数据路径与写入兜底。
- 版本号 0.3.2 → 0.3.3（无 API 变化）。

## [0.3.2] - 2026-11-08

### Fixed

- `collab_task_upsert` 收到 `doneChecks` 时现在会按验收清单重算 `progress`，agent 报告完成项后卡片不会再停留在 `0/N`。

### Changed

- `verify-host` 增加到 77 项（新增 doneChecks 重算进度的断言）。
- 版本号 0.3.1 → 0.3.2。

## [0.3.1] - 2026-11-08

### Fixed

- 拍板答案先持久化再投递：写入失败时不会再出现「agent 已收到、板上仍是待定」的半完成状态。
- 「重发」现在会把失败结果写回 `delivery`；已送达的决策拒绝重复投递（显式 `force` 可绕过）。
- 普通 subagent 提出的待拍板卡会把答案路由到它的顶层父会话，避免投给已经结束的子会话。
- 会话列表刷新加了请求代次保护；刷新期间保留已有列表，选择目标失效时自动回退。
- 为任务 B 打开 GO 面板不会再被任务 A 在途的派发结果关闭或写错错误。
- 传话发送期间禁用输入框；拍板「未传达」的中英文分隔符分别处理。
- `listSessions` 按会话事件序号缓存标题，避免每次刷新重复折叠完整事件日志。

### Changed

- 版本号 0.3.0 → 0.3.1（修复 v0.3.0 的投递时序与客户端状态问题）。
- `verify-host` 增加到 76 项：覆盖子代理拍板转投、重复投递拒绝、失败重发落盘与重启后派发。

## [0.3.0] - 2026-11-08

### Added

- **GO 派发**：任务卡上点 `GO`，选一个已打开的会话，Host 把任务 prompt 作为一条 user 消息投递给该会话的 live agent，任务自动转 `doing`，并在卡上记下派发目标与时间。新增 `listSessions` / `dispatchTask` RPC。
- **人机传话**：页面新增「传话」框，可把人的一句话直接发进任意已打开的会话；新增 `sendMessage` RPC。
- **拍板自动回投**：`collab_decision_ask` 记录提问会话；人提交拍板后，答案自动投回该会话并记录 `delivery`；未送达可重发（新增 `deliverDecision` RPC）。
- 任务卡显示最近一次派发记录，拍板卡显示投递状态与会话；`dispatches` / `messages` 均只保留最近 10 条。
- `verify-host` 新增假 `agents` / `sessions` / `sessionTitle` / `agentTeams` 服务，覆盖投递消息形状、失败不写板、掉线后重发与重启持久化（45 → 70 项）。

### Changed

- `collab_decision_ask` 的工具描述说明答案会自动回到提问会话。
- 派发 / 传话的会话列表包含 Agent Teams 队友会话（用队友名标注），过滤临时 subagent 会话。
- README 补充 GO 派发、传话、投递语义与 live 会话限制。
- 版本号 0.2.0 → 0.3.0。

## [0.2.0] - 2026-11-06

### Added

- 验收项可逐条点击勾选：新增 `toggleCheck` RPC，Host 勾选后自动重算进度。
- 项目切换器与「新建项目」：新增 `createProject` RPC。
- 页面内「新建任务」：新增 `upsertTask` RPC。
- README 重写为面向新人的介绍。
- 新增静态契约检查 `test/check-client.mjs`（locale 键对齐、RPC 方法白名单、槽位、主题变量、清理）。
- 补上 LICENSE 与 CI（两条检查脚本都跑）。

## [0.1.0] - 2026-11-04

### Added

- Host 半边：JSON 持久化，`collab_board_read` / `collab_task_upsert` / `collab_decision_ask` 三个工具，以及 `/api/dsh-team-board` RPC。
- Client 半边：侧边栏入口、待拍板卡、任务卡与状态切换。
- 行为回归脚本 `test/verify-host.mjs`。
- 插件清单、图标、中英元数据。
