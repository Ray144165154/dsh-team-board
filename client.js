window.__ModuleLoader__.load({
  id: '@local/dsh-team-board',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const LOCALE_NS = 'dsh-team-board'
    const PANEL_ID = 'dsh-team-board'
    const ENDPOINT = 'dsh-team-board'
    const POLL_MS = 6000
    const STATUS_TEXT = { todo: 'TODO', doing: 'DOING', done: 'DONE' }
    const NEXT_STATUS = { todo: 'doing', doing: 'done', done: 'todo' }

    /* ---------------------------------------------------------------- */
    /* Locale                                                           */
    /* ---------------------------------------------------------------- */

    const zh = {
      $locale: 'zh',
      'nav.label': '协作台',
      'page.title': '协作台',
      'summary.projects': '项目',
      'summary.active': '进行中',
      'summary.decisions': '待拍板',
      'section.goal': '目标',
      'section.currentTask': '当前任务',
      'section.decisions': '待拍板',
      'section.tasks': '任务',
      'decision.pending': '待定',
      'decision.answered': '已定',
      'decision.placeholder': '你的拍板...',
      'decision.submit': '提交拍板',
      'decision.submitting': '提交中…',
      'decision.answer': '拍板结果',
      'decision.empty': '暂时没有待拍板事项。agent 需要你决策时会发到这里。',
      'task.empty': '还没有任务。让 agent 用 collab_task_upsert 登记一条。',
      'task.emptyChecks': '暂无验收项',
      'task.toggle': '切换状态',
      'roles.commander': '指挥',
      'roles.executor': '执行',
      'roles.reviewer': '验收',
      'action.refresh': '刷新',
      'action.refreshing': '刷新中…',
      'state.loading': '正在读取协作台…',
      'state.updated': '更新于',
      'error.load': '读取失败：',
      'error.submit': '提交失败：',
      'error.status': '状态更新失败：',
      'error.project': '新建项目失败：',
      'error.task': '新建任务失败：',
      'error.check': '验收更新失败：',
      'project.switch': '项目',
      'project.create': '新建项目',
      'project.createPlaceholder': '项目名称',
      'task.create': '新建任务',
      'task.createPlaceholder': '任务标题',
      'action.create': '创建',
      'action.cancel': '取消',
      'action.submitting': '创建中…',
      'empty.board': '协作台还没有内容。',
      'task.go': 'GO',
      'task.goTitle': '把这条任务派发到某个会话',
      'dispatch.title': '派发',
      'dispatch.loading': '正在读取会话…',
      'dispatch.empty': '没有可派发的会话。先在侧边栏打开目标会话，再回来派发。',
      'dispatch.choose': '选择会话',
      'dispatch.target': '目标会话',
      'dispatch.note': '补充说明（可选）',
      'dispatch.submit': '派发',
      'dispatch.submitting': '派发中…',
      'dispatch.recorded': '已派发',
      'delivery.sent': '已传达',
      'delivery.failed': '未传达：',
      'delivery.missing': '还没有投递',
      'delivery.retry': '重发',
      'delivery.sending': '重发中…',
      'delivery.note': '拍板结果会自动发回提问的会话；agent 会在下一轮读到它。',
      'compose.title': '传话',
      'compose.description': '把一句话直接发进已打开的 agent 会话；对方会在下一轮读到。',
      'compose.choose': '选择会话',
      'compose.target': '会话',
      'compose.placeholder': '把一句话发进这个会话…',
      'compose.send': '发送',
      'compose.sending': '发送中…',
      'compose.sent': '已投递',
      'compose.empty': '没有已打开的会话。打开一个会话后就能传话。',
      'compose.reload': '刷新会话',
      'session.untitled': '未命名会话',
      'session.running': '运行中',
      'session.idle': '空闲',
      'session.teammate': '队友',
      'session.unavailable': '当前 DSH profile 没有提供会话服务，派发 / 传话不可用。',
      'error.dispatch': '派发失败：',
      'error.sessions': '读取会话失败：',
      'error.compose': '传话失败：',
      'error.delivery': '重发失败：',
    }

    const en = {
      $locale: 'en',
      'nav.label': 'Collab Board',
      'page.title': 'Collab Board',
      'summary.projects': 'projects',
      'summary.active': 'active',
      'summary.decisions': 'awaiting decision',
      'section.goal': 'Goal',
      'section.currentTask': 'Current task',
      'section.decisions': 'Awaiting your decision',
      'section.tasks': 'Tasks',
      'decision.pending': 'Pending',
      'decision.answered': 'Decided',
      'decision.placeholder': 'Your decision…',
      'decision.submit': 'Submit decision',
      'decision.submitting': 'Submitting…',
      'decision.answer': 'Decision',
      'decision.empty': 'No open decisions. Agents post here when they need you.',
      'task.empty': 'No tasks yet. Ask an agent to register one with collab_task_upsert.',
      'task.emptyChecks': 'No acceptance checks',
      'task.toggle': 'Change status',
      'roles.commander': 'Lead',
      'roles.executor': 'Executor',
      'roles.reviewer': 'Review',
      'action.refresh': 'Refresh',
      'action.refreshing': 'Refreshing…',
      'state.loading': 'Reading the board…',
      'state.updated': 'Updated',
      'error.load': 'Could not load the board: ',
      'error.submit': 'Could not save the decision: ',
      'error.status': 'Could not change the status: ',
      'error.project': 'Could not create the project: ',
      'error.task': 'Could not create the task: ',
      'error.check': 'Could not update the check: ',
      'project.switch': 'Project',
      'project.create': 'New project',
      'project.createPlaceholder': 'Project name',
      'task.create': 'New task',
      'task.createPlaceholder': 'Task title',
      'action.create': 'Create',
      'action.cancel': 'Cancel',
      'action.submitting': 'Creating…',
      'empty.board': 'The board is empty.',
      'task.go': 'GO',
      'task.goTitle': 'Dispatch this task to a session',
      'dispatch.title': 'Dispatch',
      'dispatch.loading': 'Reading sessions…',
      'dispatch.empty': 'No session to dispatch to. Open the target session in the sidebar first.',
      'dispatch.choose': 'Choose a session',
      'dispatch.target': 'Target session',
      'dispatch.note': 'Extra instruction (optional)',
      'dispatch.submit': 'Dispatch',
      'dispatch.submitting': 'Dispatching…',
      'dispatch.recorded': 'Dispatched',
      'delivery.sent': 'Delivered',
      'delivery.failed': 'Not delivered: ',
      'delivery.missing': 'not sent yet',
      'delivery.retry': 'Resend',
      'delivery.sending': 'Resending…',
      'delivery.note': 'Answers are sent back to the asking session automatically; the agent reads them on its next turn.',
      'compose.title': 'Message',
      'compose.description': 'Send one message straight into an open agent session; it reads it on the next turn.',
      'compose.choose': 'Choose a session',
      'compose.target': 'Session',
      'compose.placeholder': 'Send one message into this session…',
      'compose.send': 'Send',
      'compose.sending': 'Sending…',
      'compose.sent': 'Delivered',
      'compose.empty': 'No open session. Open one to send a message.',
      'compose.reload': 'Reload sessions',
      'session.untitled': 'Untitled session',
      'session.running': 'running',
      'session.idle': 'idle',
      'session.teammate': 'teammate',
      'session.unavailable': 'This DSH profile provides no session service, so dispatch and messaging are unavailable.',
      'error.dispatch': 'Could not dispatch: ',
      'error.sessions': 'Could not read sessions: ',
      'error.compose': 'Could not send the message: ',
      'error.delivery': 'Could not resend the decision: ',
    }

    /* ---------------------------------------------------------------- */
    /* Styles                                                           */
    /* ---------------------------------------------------------------- */

    const CSS = String.raw`
.tb-page { height: 100%; min-height: 0; overflow: auto; box-sizing: border-box; padding: 26px clamp(16px, 4vw, 48px) 48px; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-base); font: inherit; }
.tb-inner { max-width: 940px; margin: 0 auto; }
.tb-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.tb-title { margin: 0; font-size: 22px; line-height: 30px; font-weight: 600; letter-spacing: .2px; }
.tb-sub { margin: 4px 0 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
.tb-refresh { display: inline-flex; align-items: center; gap: 6px; flex: none; min-height: 32px; padding: 5px 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-1); font: inherit; font-size: 13px; cursor: pointer; }
.tb-refresh:hover:not(:disabled) { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); }
.tb-refresh:disabled { opacity: .6; cursor: default; }
.tb-refresh:focus-visible, .tb-primary:focus-visible, .tb-status:focus-visible, .tb-input:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.tb-secondary:focus-visible, .tb-select:focus-visible, .tb-check:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }

.tb-headMain { flex: 1 1 auto; min-width: 0; }
.tb-projectBar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 12px; }
.tb-field { display: inline-flex; align-items: center; gap: 8px; }
.tb-select { min-height: 32px; padding: 5px 30px 5px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-1); font: inherit; font-size: 13px; line-height: 20px; cursor: pointer; }
.tb-select:hover { background: var(--dsw-alias-bg-layer-2); }
.tb-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 6px; flex: none; min-height: 32px; padding: 5px 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-1); font: inherit; font-size: 13px; line-height: 20px; cursor: pointer; }
.tb-secondary:hover:not(:disabled) { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); }
.tb-secondary:disabled { opacity: .6; cursor: default; }
.tb-inlineForm { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.tb-taskForm { margin: 10px 0; }
.tb-spacer { flex: 1 1 auto; }
.tb-loading { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }

.tb-goal { padding: 16px 18px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.tb-goalRow { display: flex; gap: 12px; align-items: baseline; }
.tb-goalRow + .tb-goalRow { margin-top: 8px; }
.tb-label { flex: none; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
.tb-goalText { margin: 0; font-size: 13px; line-height: 21px; }
.tb-goalText strong { font-weight: 600; }
.tb-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }

.tb-sectionHead { display: flex; align-items: baseline; gap: 8px; margin: 26px 0 10px; }
.tb-sectionTitle { margin: 0; font-size: 14px; line-height: 22px; font-weight: 600; }
.tb-sectionCount { color: var(--dsw-alias-label-secondary); font-size: 12px; }

.tb-card { margin-bottom: 10px; padding: 14px 16px 16px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.tb-cardHead { display: flex; align-items: center; gap: 8px; }
.tb-cardIndex { flex: none; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 20px; font-variant-numeric: tabular-nums; }
.tb-cardTitle { margin: 0; font-size: 14px; line-height: 22px; font-weight: 600; }
.tb-tag { flex: none; margin-left: 2px; padding: 1px 8px; border: 1px solid var(--dsw-alias-state-warn-primary); border-radius: 999px; color: var(--dsw-alias-state-warn-primary); font-size: 11px; line-height: 18px; }
.tb-tag[data-status="answered"] { border-color: var(--dsw-alias-state-success-primary); color: var(--dsw-alias-state-success-primary); }
.tb-cardDetail { margin: 8px 0 0; color: var(--dsw-alias-label-secondary); font-size: 12.5px; line-height: 20px; }
.tb-cardDetail strong { color: var(--dsw-alias-label-primary); font-weight: 600; }
.tb-form { display: flex; gap: 8px; align-items: flex-end; margin-top: 10px; }
.tb-input { flex: 1 1 auto; min-width: 0; box-sizing: border-box; padding: 8px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-base); font: inherit; font-size: 13px; line-height: 20px; resize: vertical; min-height: 38px; }
.tb-input::placeholder { color: var(--dsw-alias-label-secondary); }
.tb-primary { flex: none; min-height: 38px; padding: 7px 14px; border: 0; border-radius: 8px; color: #fff; background: var(--dsw-alias-brand-primary); font: inherit; font-size: 13px; line-height: 20px; cursor: pointer; }
.tb-primary:disabled { opacity: .45; cursor: default; }
.tb-answer { margin-top: 10px; padding: 10px 12px; border-left: 2px solid var(--dsw-alias-state-success-primary); border-radius: 0 8px 8px 0; background: var(--dsw-alias-bg-layer-2); }
.tb-answer p { margin: 4px 0 0; font-size: 13px; line-height: 21px; }

.tb-task { margin-bottom: 10px; padding: 14px 16px 16px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.tb-taskHead { display: flex; align-items: center; gap: 8px; }
.tb-taskId { flex: none; color: var(--dsw-alias-label-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
.tb-taskTitle { margin: 0; flex: 1 1 auto; min-width: 0; font-size: 14px; line-height: 22px; font-weight: 600; overflow-wrap: anywhere; }
.tb-status { flex: none; padding: 1px 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; color: var(--dsw-alias-label-secondary); background: transparent; font: inherit; font-size: 11px; line-height: 18px; letter-spacing: .3px; cursor: pointer; }
.tb-status[data-status="doing"] { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
.tb-status[data-status="done"] { border-color: var(--dsw-alias-state-success-primary); color: var(--dsw-alias-state-success-primary); }
.tb-meta { display: flex; flex-wrap: wrap; gap: 4px 18px; margin-top: 8px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
.tb-checks { list-style: none; margin: 10px 0 0; padding: 0; }
.tb-checks li { margin-top: 4px; color: var(--dsw-alias-label-secondary); font-size: 12.5px; line-height: 20px; }
.tb-checks li[data-ok="true"] { color: var(--dsw-alias-label-primary); }
.tb-check { display: flex; gap: 8px; align-items: baseline; width: 100%; padding: 3px 4px; box-sizing: border-box; border: 0; border-radius: 6px; background: transparent; color: inherit; font: inherit; font-size: 12.5px; line-height: 20px; text-align: left; cursor: pointer; }
.tb-check:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
.tb-check:disabled { opacity: .55; cursor: default; }
.tb-checkMark { flex: none; width: 12px; color: var(--dsw-alias-state-idle-primary); font-size: 11px; }
.tb-checkLabel { flex: 1 1 auto; min-width: 0; }
.tb-checks li[data-ok="true"] .tb-checkMark { color: var(--dsw-alias-state-success-primary); }
.tb-note { margin: 8px 0 0; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 19px; white-space: pre-wrap; }

.tb-go { flex: none; min-height: 26px; padding: 2px 10px; border: 1px solid var(--dsw-alias-brand-primary); border-radius: 999px; color: var(--dsw-alias-brand-primary); background: transparent; font: inherit; font-size: 11px; line-height: 18px; font-weight: 600; letter-spacing: .5px; cursor: pointer; }
.tb-go:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
.tb-go:disabled { opacity: .45; cursor: default; }
.tb-go:focus-visible, .tb-subpanel .tb-primary:focus-visible, .tb-subpanel .tb-secondary:focus-visible, .tb-subpanel .tb-select:focus-visible, .tb-composeForm .tb-input:focus-visible, .tb-composeForm .tb-primary:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }

.tb-subpanel { margin-top: 10px; padding: 10px 12px 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; background: var(--dsw-alias-bg-base); }
.tb-subpanelHead { margin: 0 0 8px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
.tb-panelRow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.tb-panelRow .tb-field { min-width: 0; max-width: 100%; }
.tb-panelRow .tb-select, .tb-composeForm .tb-select { max-width: min(100%, 320px); }
.tb-panelRow .tb-input { flex: 1 1 240px; min-height: 32px; padding: 5px 10px; }
.tb-hint { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 12.5px; line-height: 20px; }
.tb-delivery { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 8px 0 0; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
.tb-delivery[data-status="sent"] { color: var(--dsw-alias-state-success-primary); }
.tb-delivery[data-status="failed"] { color: var(--dsw-alias-state-error-primary); }
.tb-delivery .tb-secondary { min-height: 26px; padding: 2px 10px; font-size: 11.5px; }
.tb-deliveryText { min-width: 0; }
.tb-compose { margin-top: 26px; padding: 14px 16px 16px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); }
.tb-composeHead { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; }
.tb-composeForm { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 8px; margin-top: 10px; }
.tb-composeForm .tb-input { flex: 1 1 280px; min-height: 38px; }
.tb-composeStatus { margin: 8px 0 0; color: var(--dsw-alias-state-success-primary); font-size: 12px; line-height: 18px; }
.tb-composeStatus[data-tone="error"] { color: var(--dsw-alias-state-error-primary); }

.tb-empty { padding: 18px; border: 1px dashed var(--dsw-alias-border-l2); border-radius: 12px; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
.tb-error { margin: 0 0 12px; padding: 9px 12px; border: 1px solid var(--dsw-alias-state-error-primary); border-radius: 8px; color: var(--dsw-alias-state-error-primary); font-size: 12.5px; line-height: 19px; }
.tb-foot { margin-top: 22px; color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
@media (pointer: coarse) { .tb-primary, .tb-refresh, .tb-secondary, .tb-select, .tb-check { min-height: 44px; } .tb-go { min-height: 34px; } }
`

    /* ---------------------------------------------------------------- */
    /* Presentational helpers                                           */
    /* ---------------------------------------------------------------- */

    function rich(value) {
      if (typeof value !== 'string' || value === '') return null
      const parts = value.split(/\*\*(.+?)\*\*/g)
      return parts.map((part, index) => (index % 2 === 1 ? h('strong', { key: `s${index}` }, part) : part))
    }

    function emptyState(message) {
      return h('p', { className: 'tb-empty' }, message)
    }

    function clockOf(value) {
      if (typeof value !== 'string' || value === '') return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      return date.toLocaleTimeString()
    }

    function sessionLabel(session, t) {
      const title = typeof session?.title === 'string' ? session.title.trim() : ''
      return title !== '' ? title : t('session.untitled')
    }

    function sessionOptionLabel(session, t) {
      const status = session?.status === 'running' ? t('session.running') : t('session.idle')
      const shortId = typeof session?.id === 'string' && session.id !== '' ? ` · ${session.id.slice(-6)}` : ''
      const kind = session?.kind === 'teammate' ? ` · ${t('session.teammate')}` : ''
      return `${sessionLabel(session, t)}${shortId}${kind} · ${status}`
    }

    function DispatchPanel({ task, sessions, target, note, busy, error, onChangeTarget, onChangeNote, onSubmit, onCancel, t }) {
      const items = Array.isArray(sessions?.items) ? sessions.items : []
      const ready = sessions?.unavailable !== true && items.length > 0
      return h('div', { className: 'tb-subpanel', 'data-dispatch': task.id },
        h('p', { className: 'tb-subpanelHead' }, `${t('dispatch.title')} · ${task.id}`),
        sessions?.phase === 'loading' && items.length === 0 ? h('p', { className: 'tb-hint' }, t('dispatch.loading')) : null,
        sessions?.error !== null && sessions?.error !== undefined ? h('p', { className: 'tb-error', role: 'alert' }, `${t('error.sessions')}${sessions.error}`) : null,
        sessions?.phase === 'ready' && sessions?.unavailable === true ? h('p', { className: 'tb-hint' }, t('session.unavailable')) : null,
        sessions?.phase === 'ready' && sessions?.unavailable !== true && items.length === 0 ? h('p', { className: 'tb-hint' }, t('dispatch.empty')) : null,
        ready
          ? h('div', { className: 'tb-panelRow' },
            h('label', { className: 'tb-field' },
              h('span', { className: 'tb-label' }, t('dispatch.target')),
              h('select', {
                className: 'tb-select',
                value: target ?? '',
                onChange: (event) => onChangeTarget(event.target.value),
              },
              (target ?? '') === '' ? h('option', { value: '' }, t('dispatch.choose')) : null,
              items.map((session) => h('option', { key: session.id, value: session.id }, sessionOptionLabel(session, t))))),
            h('input', {
              type: 'text',
              className: 'tb-input',
              value: note ?? '',
              placeholder: t('dispatch.note'),
              'aria-label': t('dispatch.note'),
              onChange: (event) => onChangeNote(event.target.value),
            }),
            h('button', {
              type: 'button',
              className: 'tb-primary',
              disabled: busy || (target ?? '') === '',
              onClick: onSubmit,
            }, busy ? t('dispatch.submitting') : t('dispatch.submit')),
            h('button', {
              type: 'button',
              className: 'tb-secondary',
              disabled: busy,
              onClick: onCancel,
            }, t('action.cancel')))
          : h('div', { className: 'tb-panelRow' },
            h('button', {
              type: 'button',
              className: 'tb-secondary',
              disabled: busy,
              onClick: onCancel,
            }, t('action.cancel'))),
        error === null || error === undefined
          ? null
          : h('p', { className: 'tb-error', role: 'alert' }, `${t('error.dispatch')}${error}`))
    }

    function ComposePanel({ sessions, target, text, busy, status, onChangeTarget, onChangeText, onSend, onReload, t }) {
      const items = Array.isArray(sessions?.items) ? sessions.items : []
      return h('section', { className: 'tb-compose' },
        h('div', { className: 'tb-composeHead' },
          h('h2', { className: 'tb-sectionTitle' }, t('compose.title')),
          h('span', { className: 'tb-spacer' }),
          h('button', {
            type: 'button',
            className: 'tb-secondary',
            onClick: onReload,
          }, t('compose.reload'))),
        h('p', { className: 'tb-hint' }, t('compose.description')),
        sessions?.phase === 'loading' && items.length === 0 ? h('p', { className: 'tb-hint' }, t('dispatch.loading')) : null,
        sessions?.error !== null && sessions?.error !== undefined ? h('p', { className: 'tb-error', role: 'alert' }, `${t('error.sessions')}${sessions.error}`) : null,
        sessions?.phase === 'ready' && sessions?.unavailable === true ? h('p', { className: 'tb-hint' }, t('session.unavailable')) : null,
        sessions?.phase === 'ready' && sessions?.unavailable !== true && items.length === 0 ? h('p', { className: 'tb-hint' }, t('compose.empty')) : null,
        sessions?.unavailable === true || items.length === 0
          ? null
          : h('div', { className: 'tb-composeForm' },
            h('select', {
              className: 'tb-select',
              value: target ?? '',
              'aria-label': t('compose.target'),
              onChange: (event) => onChangeTarget(event.target.value),
            },
            (target ?? '') === '' ? h('option', { value: '' }, t('compose.choose')) : null,
            items.map((session) => h('option', { key: session.id, value: session.id }, sessionOptionLabel(session, t)))),
            h('textarea', {
              className: 'tb-input',
              rows: 2,
              value: text ?? '',
              placeholder: t('compose.placeholder'),
              'aria-label': t('compose.placeholder'),
              disabled: busy,
              onChange: (event) => onChangeText(event.target.value),
            }),
            h('button', {
              type: 'button',
              className: 'tb-primary',
              disabled: busy || (target ?? '') === '' || (text ?? '').trim() === '',
              onClick: onSend,
            }, busy ? t('compose.sending') : t('compose.send'))),
        status === null || status === undefined
          ? null
          : h('p', { className: 'tb-composeStatus', 'data-tone': status.tone, role: 'status' }, status.message))
    }

    function BoardGlyph({ size, active }) {
      const px = typeof size === 'number' && size > 0 ? size : 20
      const stroke = active ? 'var(--dsw-alias-brand-primary)' : 'currentColor'
      return h('svg', {
        width: px, height: px, viewBox: '0 0 24 24', fill: 'none',
        'aria-hidden': true, style: { display: 'block' },
      },
      h('rect', { x: 3, y: 4, width: 18, height: 16, rx: 3, stroke, strokeWidth: 1.5 }),
      h('rect', { x: 6, y: 7.5, width: 4, height: 3.4, rx: 1, fill: stroke, opacity: 0.85 }),
      h('rect', { x: 6, y: 12.6, width: 4, height: 3.4, rx: 1, fill: stroke, opacity: 0.45 }),
      h('rect', { x: 11.6, y: 8.2, width: 6.4, height: 1.5, rx: 0.75, fill: stroke, opacity: 0.85 }),
      h('rect', { x: 11.6, y: 13.3, width: 4.4, height: 1.5, rx: 0.75, fill: stroke, opacity: 0.45 }))
    }

    function DecisionCard({ decision, index, draft, submitting, onDraft, onSubmit, retryBusy, onRetry, t }) {
      const answered = decision.status === 'answered'
      const delivery = decision.delivery ?? null
      const hasSource = typeof decision.sourceSessionId === 'string' && decision.sourceSessionId !== ''
      const delivered = delivery?.status === 'sent'
      const deliveryLabel = delivered
        ? `${t('delivery.sent')} · ${delivery.sessionTitle || decision.sourceSessionTitle || t('session.untitled')}${clockOf(delivery.at) === '' ? '' : ` · ${clockOf(delivery.at)}`}`
        : `${t('delivery.failed')}${delivery?.error ?? t('delivery.missing')}`
      return h('article', { className: 'tb-card', 'data-decision': decision.id },
        h('div', { className: 'tb-cardHead' },
          h('span', { className: 'tb-cardIndex' }, String(index + 1)),
          h('h3', { className: 'tb-cardTitle' }, decision.title),
          h('span', { className: 'tb-tag', 'data-status': answered ? 'answered' : 'open' },
            answered ? t('decision.answered') : t('decision.pending'))),
        decision.detail === '' ? null : h('p', { className: 'tb-cardDetail' }, rich(decision.detail)),
        answered
          ? h('div', { className: 'tb-answer' },
            h('span', { className: 'tb-label' }, t('decision.answer')),
            h('p', null, decision.answer),
            hasSource
              ? h('div', { className: 'tb-delivery', 'data-status': delivered ? 'sent' : 'failed' },
                h('span', { className: 'tb-deliveryText' }, deliveryLabel),
                delivered
                  ? null
                  : h('button', {
                    type: 'button',
                    className: 'tb-secondary',
                    disabled: retryBusy,
                    onClick: () => onRetry(decision.id),
                  }, retryBusy ? t('delivery.sending') : t('delivery.retry')))
              : null)
          : h('div', { className: 'tb-form' },
            h('textarea', {
              className: 'tb-input',
              rows: 2,
              value: draft ?? '',
              placeholder: t('decision.placeholder'),
              'aria-label': `${decision.title} · ${t('decision.placeholder')}`,
              onChange: (event) => onDraft(decision.id, event.target.value),
            }),
            h('button', {
              type: 'button',
              className: 'tb-primary',
              disabled: submitting || (draft ?? '').trim() === '',
              onClick: () => onSubmit(decision.id),
            }, submitting ? t('decision.submitting') : t('decision.submit'))))
    }

    function TaskCard({ task, dispatch, sessions, onCycle, onToggleCheck, busyCheck, onOpenDispatch, onDispatchClose, onDispatchTarget, onDispatchNote, onDispatchSubmit, t }) {
      const checks = Array.isArray(task.checks) ? task.checks : []
      const progress = task.progress ?? { passed: 0, total: 0 }
      const meta = [
        [t('roles.commander'), task.commander],
        [t('roles.executor'), task.executor],
        [t('roles.reviewer'), `${progress.passed ?? 0}/${progress.total ?? 0}`],
      ].filter(([, value]) => typeof value === 'string' && value !== '')
      const dispatches = Array.isArray(task.dispatches) ? task.dispatches : []
      const lastDispatch = dispatches.length === 0 ? null : dispatches[dispatches.length - 1]
      const dispatchLabel = lastDispatch === null
        ? ''
        : `${t('dispatch.recorded')} · ${lastDispatch.sessionTitle || t('session.untitled')}${clockOf(lastDispatch.at) === '' ? '' : ` · ${clockOf(lastDispatch.at)}`}`
      return h('article', { className: 'tb-task', 'data-task': task.id },
        h('div', { className: 'tb-taskHead' },
          h('span', { className: 'tb-taskId' }, task.id),
          h('h3', { className: 'tb-taskTitle' }, task.title),
          h('button', {
            type: 'button',
            className: 'tb-status',
            'data-status': task.status,
            title: t('task.toggle'),
            'aria-label': `${t('task.toggle')} · ${STATUS_TEXT[task.status] ?? String(task.status ?? 'TODO')}`,
            onClick: () => onCycle(task),
          }, STATUS_TEXT[task.status] ?? String(task.status ?? 'TODO')),
          h('button', {
            type: 'button',
            className: 'tb-go',
            title: t('task.goTitle'),
            'aria-label': `${t('task.goTitle')} · ${task.id}`,
            disabled: dispatch !== null && dispatch !== undefined && dispatch.busy === true,
            onClick: () => onOpenDispatch(task),
          }, t('task.go'))),
        meta.length === 0 ? null : h('div', { className: 'tb-meta' },
          meta.map(([label, value]) => h('span', { key: label }, `${label} · ${value}`))),
        lastDispatch === null
          ? null
          : h('p', { className: 'tb-delivery', 'data-status': lastDispatch.status === 'sent' ? 'sent' : 'failed' },
            h('span', { className: 'tb-deliveryText' }, dispatchLabel)),
        checks.length === 0
          ? h('p', { className: 'tb-meta' }, t('task.emptyChecks'))
          : h('ul', { className: 'tb-checks' }, checks.map((check, index) => {
            const busyKey = `${task.id}:${index}`
            return h('li', {
              key: `${index}-${check.label}`,
              'data-ok': check.ok === true ? 'true' : 'false',
            },
            h('button', {
              type: 'button',
              className: 'tb-check',
              'aria-pressed': check.ok === true ? 'true' : 'false',
              'aria-busy': busyCheck === busyKey ? 'true' : 'false',
              disabled: busyCheck === busyKey,
              onClick: () => onToggleCheck(task.id, index),
            },
            h('span', { className: 'tb-checkMark', 'aria-hidden': true }, check.ok === true ? '●' : '○'),
            h('span', { className: 'tb-checkLabel' }, check.label)))
          })),
        typeof task.note === 'string' && task.note !== '' ? h('p', { className: 'tb-note' }, task.note) : null,
        dispatch === null || dispatch === undefined
          ? null
          : h(DispatchPanel, {
            task,
            sessions,
            target: dispatch.target,
            note: dispatch.note,
            busy: dispatch.busy,
            error: dispatch.error,
            onChangeTarget: onDispatchTarget,
            onChangeNote: onDispatchNote,
            onSubmit: onDispatchSubmit,
            onCancel: onDispatchClose,
            t,
          }))
    }

    function TeamBoardPage(props) {
      const call = props.call
      const t = typeof props.t === 'function' ? props.t : (key) => key
      const [snapshot, setSnapshot] = React.useState({ phase: 'loading', board: null, error: null })
      const [drafts, setDrafts] = React.useState({})
      const [submitting, setSubmitting] = React.useState('')
      const [notice, setNotice] = React.useState(null)
      const [refreshing, setRefreshing] = React.useState(false)
      const [selectedProjectId, setSelectedProjectId] = React.useState(null)
      const [checkBusy, setCheckBusy] = React.useState('')
      const [projectFormOpen, setProjectFormOpen] = React.useState(false)
      const [projectName, setProjectName] = React.useState('')
      const [projectBusy, setProjectBusy] = React.useState(false)
      const [taskFormOpen, setTaskFormOpen] = React.useState(false)
      const [taskTitle, setTaskTitle] = React.useState('')
      const [taskBusy, setTaskBusy] = React.useState(false)
      const [sessionsState, setSessionsState] = React.useState({ phase: 'idle', items: [], error: null, refreshing: false, unavailable: false })
      const [dispatch, setDispatch] = React.useState(null)
      const [compose, setCompose] = React.useState({ target: '', text: '', busy: false, status: null })
      const [retry, setRetry] = React.useState({ id: '', busy: false })
      const live = React.useRef(true)
      const busy = React.useRef(false)
      const sessionLoadSeq = React.useRef(0)
      const deliveryIds = React.useRef(new Map())
      const deliveryId = (method, payload) => {
        const key = JSON.stringify([method, payload])
        if (!deliveryIds.current.has(key)) {
          let saved
          try { saved = window.sessionStorage.getItem(`team-board:${key}`) } catch {}
          const id = saved || window.crypto.randomUUID()
          deliveryIds.current.set(key, id)
          try { window.sessionStorage.setItem(`team-board:${key}`, id) } catch {}
        }
        return { key, requestId: deliveryIds.current.get(key) }
      }
      const finishDelivery = (attempt) => {
        deliveryIds.current.delete(attempt.key)
        try { window.sessionStorage.removeItem(`team-board:${attempt.key}`) } catch {}
      }

      const load = React.useCallback(async (signal) => {
        if (busy.current) return
        busy.current = true
        setSnapshot((previous) => (previous.board === null ? { ...previous, phase: 'loading' } : previous))
        try {
          const value = await call('state', {}, signal)
          if (!live.current) return
          setSnapshot({ phase: 'ready', board: value?.board ?? null, error: null })
        } catch (error) {
          if (!live.current) return
          setSnapshot((previous) => ({
            phase: previous.board === null ? 'error' : 'ready',
            board: previous.board,
            error: error?.message ?? String(error),
          }))
        } finally {
          busy.current = false
        }
      }, [call])

      const loadSessions = React.useCallback(async () => {
        const seq = sessionLoadSeq.current + 1
        sessionLoadSeq.current = seq
        setSessionsState((previous) => ({
          ...previous,
          // Keep the cached list usable while a refresh is in flight; only a
          // truly empty list shows the spinner state.
          phase: previous.items.length > 0 ? 'ready' : 'loading',
          refreshing: true,
          error: null,
        }))
        try {
          const value = await call('listSessions', {})
          if (!live.current || seq !== sessionLoadSeq.current) return
          setSessionsState({
            phase: 'ready',
            items: Array.isArray(value?.sessions) ? value.sessions : [],
            error: null,
            refreshing: false,
            unavailable: value?.unavailable === true,
          })
        } catch (error) {
          if (!live.current || seq !== sessionLoadSeq.current) return
          setSessionsState((previous) => ({
            phase: previous.items.length > 0 ? 'ready' : 'error',
            items: previous.items,
            error: error?.message ?? String(error),
            refreshing: false,
            unavailable: previous.unavailable === true,
          }))
        }
      }, [call])

      React.useEffect(() => {
        live.current = true
        load()
        void loadSessions()
        const timer = window.setInterval(() => { void load() }, POLL_MS)
        const onFocus = () => { void load(); void loadSessions() }
        window.addEventListener('focus', onFocus)
        return () => {
          live.current = false
          window.clearInterval(timer)
          window.removeEventListener('focus', onFocus)
        }
      }, [load, loadSessions])

      React.useEffect(() => {
        if (selectedProjectId !== null) return
        const list = Array.isArray(snapshot.board?.projects) ? snapshot.board.projects : []
        const seed = list.find((entry) => entry.status === 'active') ?? list[0]
        if (seed !== undefined) setSelectedProjectId(seed.id)
      }, [selectedProjectId, snapshot.board])

      React.useEffect(() => {
        if (sessionsState.phase !== 'ready') return
        const items = sessionsState.items
        const ids = new Set(items.map((session) => session.id))
        const fallback = items.length === 1 ? items[0].id : ''
        const reconcile = (previous) => {
          if (previous.target !== '' && ids.has(previous.target)) return previous
          return previous.target === fallback ? previous : { ...previous, target: fallback }
        }
        setCompose(reconcile)
        setDispatch((previous) => (previous === null ? previous : reconcile(previous)))
      }, [sessionsState])

      const refresh = async () => {
        setRefreshing(true)
        await Promise.all([load(), loadSessions()])
        if (live.current) setRefreshing(false)
      }

      const onDraft = (id, value) => {
        setDrafts((previous) => ({ ...previous, [id]: value }))
      }

      const submit = async (id) => {
        const answer = (drafts[id] ?? '').trim()
        if (answer === '' || submitting !== '') return
        setSubmitting(id)
        setNotice(null)
        try {
          const value = await call('answerDecision', { id, answer })
          if (!live.current) return
          setDrafts((previous) => {
            const next = { ...previous }
            delete next[id]
            return next
          })
          setSnapshot({ phase: 'ready', board: value?.board ?? null, error: null })
          if (value?.warning) setNotice({ tone: 'error', message: value.warning })
        } catch (error) {
          if (live.current) setNotice({ tone: 'error', message: `${t('error.submit')}${error?.message ?? error}` })
        } finally {
          if (live.current) setSubmitting('')
        }
      }

      const cycleStatus = async (task) => {
        const status = NEXT_STATUS[task.status] ?? 'todo'
        setNotice(null)
        try {
          const value = await call('setTaskStatus', { id: task.id, status })
          if (!live.current) return
          setSnapshot({ phase: 'ready', board: value?.board ?? null, error: null })
        } catch (error) {
          if (live.current) setNotice({ tone: 'error', message: `${t('error.status')}${error?.message ?? error}` })
        }
      }

      const toggleCheck = async (taskId, index) => {
        const key = `${taskId}:${index}`
        if (checkBusy !== '') return
        setCheckBusy(key)
        setNotice(null)
        try {
          const value = await call('toggleCheck', { taskId, index })
          if (!live.current) return
          setSnapshot({ phase: 'ready', board: value?.board ?? null, error: null })
        } catch (error) {
          if (live.current) setNotice({ tone: 'error', message: `${t('error.check')}${error?.message ?? error}` })
        } finally {
          if (live.current) setCheckBusy('')
        }
      }

      const submitProject = async () => {
        const name = projectName.trim()
        if (name === '' || projectBusy) return
        setProjectBusy(true)
        setNotice(null)
        try {
          const value = await call('createProject', { name })
          if (!live.current) return
          setSnapshot({ phase: 'ready', board: value?.board ?? null, error: null })
          const created = value?.project
          if (created !== null && typeof created === 'object' && typeof created.id === 'string') {
            setSelectedProjectId(created.id)
          }
          setProjectName('')
          setProjectFormOpen(false)
        } catch (error) {
          if (live.current) setNotice({ tone: 'error', message: `${t('error.project')}${error?.message ?? error}` })
        } finally {
          if (live.current) setProjectBusy(false)
        }
      }

      const submitTask = async (projectId) => {
        const title = taskTitle.trim()
        if (title === '' || taskBusy || projectId === null || projectId === undefined) return
        setTaskBusy(true)
        setNotice(null)
        try {
          const value = await call('upsertTask', { projectId, title })
          if (!live.current) return
          setSnapshot({ phase: 'ready', board: value?.board ?? null, error: null })
          setTaskTitle('')
          setTaskFormOpen(false)
        } catch (error) {
          if (live.current) setNotice({ tone: 'error', message: `${t('error.task')}${error?.message ?? error}` })
        } finally {
          if (live.current) setTaskBusy(false)
        }
      }

      const openDispatch = (task) => {
        const items = sessionsState.phase === 'ready' ? sessionsState.items : []
        const previous = Array.isArray(task.dispatches) && task.dispatches.length > 0
          ? task.dispatches[task.dispatches.length - 1].sessionId
          : ''
        const reopen = items.some((session) => session.id === previous) ? previous : ''
        const only = reopen !== '' ? reopen : (items.length === 1 ? items[0].id : '')
        setDispatch({ taskId: task.id, target: only, note: '', busy: false, error: null })
        setNotice(null)
        void loadSessions()
      }

      const closeDispatch = () => setDispatch(null)

      const changeDispatchTarget = (value) => {
        setDispatch((previous) => (previous === null ? previous : { ...previous, target: value }))
      }

      const changeDispatchNote = (value) => {
        setDispatch((previous) => (previous === null ? previous : { ...previous, note: value }))
      }

      const submitDispatch = async () => {
        if (dispatch === null || dispatch.busy) return
        const taskId = dispatch.taskId
        const sessionId = dispatch.target.trim()
        if (sessionId === '') return
        setDispatch((previous) => (previous === null ? previous : { ...previous, busy: true, error: null }))
        setNotice(null)
        try {
          const payload = { taskId, sessionId, note: dispatch.note.trim() }
          const attempt = deliveryId('dispatchTask', payload)
          const value = await call('dispatchTask', { ...payload, requestId: attempt.requestId })
          if (!value?.warning) finishDelivery(attempt)
          if (!live.current) return
          setSnapshot({ phase: 'ready', board: value?.board ?? null, error: null })
          if (value?.warning) setNotice({ tone: 'error', message: value.warning })
          // Another task's GO panel may have opened while this request was in
          // flight; only this task's panel may close.
          setDispatch((previous) => (previous !== null && previous.taskId === taskId ? null : previous))
        } catch (error) {
          if (live.current) {
            setDispatch((previous) => (previous !== null && previous.taskId === taskId
              ? { ...previous, busy: false, error: error?.message ?? String(error) }
              : previous))
          }
        }
      }

      const retryDecision = async (id) => {
        if (retry.busy) return
        setRetry({ id, busy: true })
        setNotice(null)
        try {
          const value = await call('deliverDecision', { id })
          if (!live.current) return
          setSnapshot({ phase: 'ready', board: value?.board ?? null, error: null })
          if (value?.warning) setNotice({ tone: 'error', message: value.warning })
          const delivery = value?.delivery
          if (delivery?.status !== 'sent') {
            setNotice({
              tone: 'error',
              message: `${t('error.delivery')}${delivery?.error ?? t('delivery.missing')}`,
            })
          }
        } catch (error) {
          if (live.current) setNotice({ tone: 'error', message: `${t('error.delivery')}${error?.message ?? error}` })
        } finally {
          if (live.current) setRetry({ id: '', busy: false })
        }
      }

      const sendCompose = async () => {
        const sessionId = compose.target.trim()
        const body = compose.text.trim()
        if (sessionId === '' || body === '' || compose.busy) return
        setCompose((previous) => ({ ...previous, busy: true, status: null }))
        setNotice(null)
        try {
          const payload = { sessionId, text: body }
          const attempt = deliveryId('sendMessage', payload)
          const value = await call('sendMessage', { ...payload, requestId: attempt.requestId })
          if (!value?.warning) finishDelivery(attempt)
          if (!live.current) return
          setSnapshot({ phase: 'ready', board: value?.board ?? null, error: null })
          if (value?.warning) setNotice({ tone: 'error', message: value.warning })
          const delivery = value?.delivery
          const label = delivery?.sessionTitle || t('session.untitled')
          const time = clockOf(delivery?.at)
          setCompose((previous) => ({
            ...previous,
            text: '',
            busy: false,
            status: {
              tone: 'sent',
              message: `${t('compose.sent')} · ${label}${time === '' ? '' : ` · ${time}`}`,
            },
          }))
        } catch (error) {
          if (live.current) {
            setCompose((previous) => ({
              ...previous,
              busy: false,
              status: { tone: 'error', message: `${t('error.compose')}${error?.message ?? error}` },
            }))
          }
        }
      }

      const dispatchForTask = (task) => (dispatch !== null && dispatch.taskId === task.id ? dispatch : null)

      const board = snapshot.board
      const projects = Array.isArray(board?.projects) ? board.projects : []
      const decisions = Array.isArray(board?.decisions) ? board.decisions : []
      const tasks = Array.isArray(board?.tasks) ? board.tasks : []
      const project = projects.find((entry) => entry.id === selectedProjectId)
        ?? projects.find((entry) => entry.status === 'active')
        ?? projects[0]
        ?? null
      const projectDecisions = decisions.filter((entry) => project === null || entry.projectId === project.id)
      const orderedDecisions = projectDecisions
        .map((entry, index) => ({ entry, index }))
        .sort((left, right) => {
          const leftOpen = left.entry.status === 'open' ? 0 : 1
          const rightOpen = right.entry.status === 'open' ? 0 : 1
          return leftOpen - rightOpen || left.index - right.index
        })
      const projectTasks = tasks.filter((entry) => project === null || entry.projectId === project.id)
      const openDecisions = decisions.filter((entry) => entry.status === 'open')
      const activeProjects = projects.filter((entry) => entry.status === 'active')
      const summary = [
        `${t('summary.projects')} ${projects.length}`,
        `${t('summary.active')} ${activeProjects.length}`,
        `${t('summary.decisions')} ${openDecisions.length}`,
      ].join(' · ')
      const errorMessage = notice !== null
        ? notice.message
        : snapshot.error !== null
          ? `${t('error.load')}${snapshot.error}`
          : null
      const updatedAt = typeof board?.updatedAt === 'string' ? new Date(board.updatedAt) : null

      if (snapshot.phase === 'loading' && board === null) {
        return h('div', { className: 'tb-page' },
          h('div', { className: 'tb-inner' },
            h('p', { className: 'tb-loading' }, t('state.loading'))))
      }

      if (snapshot.phase === 'error' && board === null) {
        return h('div', { className: 'tb-page' },
          h('div', { className: 'tb-inner' },
            h('p', { className: 'tb-error', role: 'alert' }, errorMessage),
            h('button', {
              type: 'button',
              className: 'tb-refresh',
              onClick: () => { void refresh() },
              disabled: refreshing,
            }, refreshing ? t('action.refreshing') : t('action.refresh'))))
      }

      return h('div', { className: 'tb-page' },
        h('div', { className: 'tb-inner' },
          h('header', { className: 'tb-head' },
            h('div', { className: 'tb-headMain' },
              h('h1', { className: 'tb-title' }, project?.name ?? t('page.title')),
              h('p', { className: 'tb-sub' }, summary),
              h('div', { className: 'tb-projectBar' },
                projects.length > 1
                  ? h('label', { className: 'tb-field' },
                    h('span', { className: 'tb-label' }, t('project.switch')),
                    h('select', {
                      className: 'tb-select',
                      value: project?.id ?? '',
                      onChange: (event) => setSelectedProjectId(event.target.value),
                    }, projects.map((entry) => h('option', { key: entry.id, value: entry.id }, entry.name))))
                  : null,
                projectFormOpen
                  ? h('div', { className: 'tb-inlineForm' },
                    h('input', {
                      type: 'text',
                      className: 'tb-input',
                      value: projectName,
                      placeholder: t('project.createPlaceholder'),
                      'aria-label': t('project.createPlaceholder'),
                      onChange: (event) => setProjectName(event.target.value),
                      onKeyDown: (event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          if (projectName.trim() !== '' && !projectBusy) void submitProject()
                        }
                      },
                    }),
                    h('button', {
                      type: 'button',
                      className: 'tb-primary',
                      disabled: projectBusy || projectName.trim() === '',
                      onClick: () => { void submitProject() },
                    }, projectBusy ? t('action.submitting') : t('action.create')),
                    h('button', {
                      type: 'button',
                      className: 'tb-secondary',
                      disabled: projectBusy,
                      onClick: () => { setProjectFormOpen(false); setProjectName('') },
                    }, t('action.cancel')))
                  : h('button', {
                    type: 'button',
                    className: 'tb-secondary',
                    onClick: () => setProjectFormOpen(true),
                  }, t('project.create')))),
            h('button', {
              type: 'button',
              className: 'tb-refresh',
              onClick: () => { void refresh() },
              disabled: refreshing,
            }, refreshing ? t('action.refreshing') : t('action.refresh'))),
          errorMessage === null ? null : h('p', { className: 'tb-error', role: 'alert' }, errorMessage),
          project === null ? null : h('section', { className: 'tb-goal' },
            h('div', { className: 'tb-goalRow' },
              h('span', { className: 'tb-label' }, t('section.goal')),
              h('p', { className: 'tb-goalText' }, rich(project.goal))),
            typeof project.currentTask === 'string' && project.currentTask !== ''
              ? h('div', { className: 'tb-goalRow' },
                h('span', { className: 'tb-label' }, t('section.currentTask')),
                h('span', { className: 'tb-mono' }, project.currentTask))
              : null),
          h('div', { className: 'tb-sectionHead' },
            h('h2', { className: 'tb-sectionTitle' }, t('section.decisions')),
            h('span', { className: 'tb-sectionCount' }, String(openDecisions.length))),
          orderedDecisions.length === 0
            ? emptyState(t('decision.empty'))
            : [
              h('p', { key: 'decision-hint', className: 'tb-hint' }, t('delivery.note')),
              ...orderedDecisions.map(({ entry }, index) => h(DecisionCard, {
                key: entry.id,
                decision: entry,
                index,
                draft: drafts[entry.id],
                submitting: submitting === entry.id,
                onDraft,
                onSubmit: (id) => { void submit(id) },
                retryBusy: retry.busy && retry.id === entry.id,
                onRetry: (id) => { void retryDecision(id) },
                t,
              })),
            ],
          h('div', { className: 'tb-sectionHead' },
            h('h2', { className: 'tb-sectionTitle' }, t('section.tasks')),
            h('span', { className: 'tb-sectionCount' }, String(projectTasks.length)),
            h('span', { className: 'tb-spacer' }),
            project === null || taskFormOpen ? null : h('button', {
              type: 'button',
              className: 'tb-secondary',
              onClick: () => setTaskFormOpen(true),
            }, t('task.create'))),
          taskFormOpen
            ? h('div', { className: 'tb-inlineForm tb-taskForm' },
              h('input', {
                type: 'text',
                className: 'tb-input',
                value: taskTitle,
                placeholder: t('task.createPlaceholder'),
                'aria-label': t('task.createPlaceholder'),
                onChange: (event) => setTaskTitle(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    if (taskTitle.trim() !== '' && !taskBusy) void submitTask(project?.id)
                  }
                },
              }),
              h('button', {
                type: 'button',
                className: 'tb-primary',
                disabled: taskBusy || taskTitle.trim() === '',
                onClick: () => { void submitTask(project?.id) },
              }, taskBusy ? t('action.submitting') : t('action.create')),
              h('button', {
                type: 'button',
                className: 'tb-secondary',
                disabled: taskBusy,
                onClick: () => { setTaskFormOpen(false); setTaskTitle('') },
              }, t('action.cancel')))
            : null,
          projectTasks.length === 0
            ? emptyState(t('task.empty'))
            : projectTasks.map((task) => h(TaskCard, {
              key: task.id,
              task,
              dispatch: dispatchForTask(task),
              sessions: sessionsState,
              onCycle: (entry) => { void cycleStatus(entry) },
              onToggleCheck: (taskId, index) => { void toggleCheck(taskId, index) },
              busyCheck: checkBusy,
              onOpenDispatch: openDispatch,
              onDispatchClose: closeDispatch,
              onDispatchTarget: changeDispatchTarget,
              onDispatchNote: changeDispatchNote,
              onDispatchSubmit: () => { void submitDispatch() },
              t,
            })),
          h(ComposePanel, {
            sessions: sessionsState,
            target: compose.target,
            text: compose.text,
            busy: compose.busy,
            status: compose.status,
            onChangeTarget: (value) => setCompose((previous) => ({ ...previous, target: value })),
            onChangeText: (value) => setCompose((previous) => ({ ...previous, text: value })),
            onSend: () => { void sendCompose() },
            onReload: () => { void loadSessions() },
            t,
          }),
          h('footer', { className: 'tb-foot' },
            updatedAt === null ? '' : `${t('state.updated')} ${updatedAt.toLocaleTimeString()}`)))
    }

    /* ---------------------------------------------------------------- */
    /* Plugin                                                           */
    /* ---------------------------------------------------------------- */

    return {
      inject: ['slots', 'connection', 'locale'],
      apply(ctx) {
        const translate = ctx.locale.bind(LOCALE_NS)
        const call = (method, payload, signal) => ctx.connection.rpc.call(
          '/api',
          ENDPOINT,
          { method, payload: payload ?? {} },
          signal,
        )

        ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }), 'team-board: locale')
        ctx.effect(() => {
          const element = document.createElement('style')
          element.id = 'dsh-team-board-styles'
          element.textContent = CSS
          document.head.appendChild(element)
          return () => { element.remove() }
        }, 'team-board: styles')

        ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 20,
          label: () => translate('nav.label'),
          locale: LOCALE_NS,
        }, BoardGlyph)), 'team-board: sidebar entry')

        ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: LOCALE_NS,
          inject: () => ({ call, t: translate }),
        }, TeamBoardPage)), 'team-board: main page')
      },
    }
  },
})
