# 更新日志

本项目按 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 的结构维护更新记录，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。每次发布把改动归类到「新增 / 变更 / 修复」下；尚未发布的改动暂存在 `[Unreleased]`，发版时再挪到对应的版本号。

## [Unreleased]

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
