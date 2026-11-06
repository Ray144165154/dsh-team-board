# 更新日志

本项目按 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 的结构维护更新记录，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。每次发布把改动归类到「新增 / 变更 / 修复」下；尚未发布的改动暂存在 `[Unreleased]`，发版时再挪到对应的版本号。

## [Unreleased]

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
