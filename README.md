# 协作台 · 多 agent 协作协议管理器

DSH 插件（Host + Client 两侧），在侧边栏注册「协作台」入口，主区是一个多 agent 协作看板：
人在这里**拍板**，agent 在这里**登记任务、更新验收、提出待决问题**。

- 包名：`@local/dsh-team-board`
- 侧边栏入口 id / 主区 key：`dsh-team-board`（顺序 20）
- 数据文件：`$DSH_HOME/team-board/board.json`（默认 `~/.dsh/team-board/board.json`）
- RPC：`POST /api/dsh-team-board`（浏览器已认证，仅本机页面可调）

## 协议（谁负责什么）

| 角色 | 在卡上的字段 | 能做什么 |
| --- | --- | --- |
| 指挥 | `commander` | 拆任务、定验收项（`collab_task_upsert`） |
| 执行 | `executor` | 推进状态、报进度、勾验收（`collab_task_upsert`） |
| 验收 | `reviewer` + `progress.passed/total` | 只读确认，人可在页面点状态胶囊切换 `TODO → DOING → DONE` |
| 人 | 待拍板卡 | 唯一能回答 `待定` 卡的角色；回答后卡变 `已定`，agent 用 `collab_board_read` 读到答案 |

规则由 Host 一侧唯一实现，UI 与工具调用同一条代码路径，不会各算各的。

## Agent 工具

| 工具 | 用途 |
| --- | --- |
| `collab_board_read` | 读项目目标、待拍板（含已给的答案）、任务与验收项 |
| `collab_task_upsert` | 建任务 / 改状态、角色、进度、验收项、备注；验收项按 label 保留完成态 |
| `collab_decision_ask` | 卡住时发一张待拍板卡，人回答后自行回读 |

**拍板只能由人做**：`answerDecision` 只暴露在页面 RPC 上，没有对应的 agent 工具。

## 页面

- 头部：项目名 + `项目 N · 进行中 N · 待拍板 N`
- 目标卡：目标 + 当前任务
- 待拍板：编号、标题、`待定/已定` 标签、说明（支持 `**加粗**`）、输入框 + 提交；已定的显示答案
- 任务卡：`T-078`、标题、状态胶囊、`指挥 · claude 执行 · deepseek 验收 0/3`、验收项 `○/●`、备注
- 每 6 秒轮询 + 窗口聚焦刷新 + 手动刷新；样式只用 `--dsw-alias-*` 主题变量

## 验证

```bash
node test/verify-host.mjs
```

用假 ctx + 临时 `DSH_HOME` 跑通：RPC 信封、状态读写、拍板/改状态、错误分支、三个工具、重启后持久化。
页面视觉未在浏览器中人工核对（本机无浏览器控制），只确认了 Client 槽位注册与 Host 行为。

## 卸载 / 重置

- 卸载：插件页移除 `@local/dsh-team-board`，或在 `plugin_manager` 里 `remove_bundle`。
- 重置数据：删除 `~/.dsh/team-board/board.json`，下次读取会重新生成示例看板。
