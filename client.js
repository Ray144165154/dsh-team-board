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
      'empty.board': '协作台还没有内容。',
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
      'empty.board': 'The board is empty.',
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
.tb-taskTitle { margin: 0; flex: 1 1 auto; font-size: 14px; line-height: 22px; font-weight: 600; }
.tb-status { flex: none; padding: 1px 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; color: var(--dsw-alias-label-secondary); background: transparent; font: inherit; font-size: 11px; line-height: 18px; letter-spacing: .3px; cursor: pointer; }
.tb-status[data-status="doing"] { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
.tb-status[data-status="done"] { border-color: var(--dsw-alias-state-success-primary); color: var(--dsw-alias-state-success-primary); }
.tb-meta { display: flex; flex-wrap: wrap; gap: 4px 18px; margin-top: 8px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
.tb-checks { list-style: none; margin: 10px 0 0; padding: 0; }
.tb-checks li { display: flex; gap: 8px; align-items: baseline; margin-top: 4px; color: var(--dsw-alias-label-secondary); font-size: 12.5px; line-height: 20px; }
.tb-checks li[data-ok="true"] { color: var(--dsw-alias-label-primary); }
.tb-checkMark { flex: none; width: 12px; color: var(--dsw-alias-state-idle-primary); font-size: 11px; }
.tb-checks li[data-ok="true"] .tb-checkMark { color: var(--dsw-alias-state-success-primary); }
.tb-note { margin: 8px 0 0; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 19px; white-space: pre-wrap; }

.tb-empty { padding: 18px; border: 1px dashed var(--dsw-alias-border-l2); border-radius: 12px; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
.tb-error { margin: 0 0 12px; padding: 9px 12px; border: 1px solid var(--dsw-alias-state-error-primary); border-radius: 8px; color: var(--dsw-alias-state-error-primary); font-size: 12.5px; line-height: 19px; }
.tb-foot { margin-top: 22px; color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
@media (pointer: coarse) { .tb-primary, .tb-refresh { min-height: 44px; } }
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

    function DecisionCard({ decision, index, draft, submitting, onDraft, onSubmit, t }) {
      const answered = decision.status === 'answered'
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
            h('p', null, decision.answer))
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

    function TaskCard({ task, onCycle, t }) {
      const checks = Array.isArray(task.checks) ? task.checks : []
      const progress = task.progress ?? { passed: 0, total: 0 }
      const meta = [
        [t('roles.commander'), task.commander],
        [t('roles.executor'), task.executor],
        [t('roles.reviewer'), `${progress.passed ?? 0}/${progress.total ?? 0}`],
      ].filter(([, value]) => typeof value === 'string' && value !== '')
      return h('article', { className: 'tb-task', 'data-task': task.id },
        h('div', { className: 'tb-taskHead' },
          h('span', { className: 'tb-taskId' }, task.id),
          h('h3', { className: 'tb-taskTitle' }, task.title),
          h('button', {
            type: 'button',
            className: 'tb-status',
            'data-status': task.status,
            title: t('task.toggle'),
            onClick: () => onCycle(task),
          }, STATUS_TEXT[task.status] ?? String(task.status ?? 'TODO'))),
        meta.length === 0 ? null : h('div', { className: 'tb-meta' },
          meta.map(([label, value]) => h('span', { key: label }, `${label} · ${value}`))),
        checks.length === 0
          ? h('p', { className: 'tb-meta' }, t('task.emptyChecks'))
          : h('ul', { className: 'tb-checks' }, checks.map((check, index) => h('li', {
            key: `${index}-${check.label}`,
            'data-ok': check.ok === true ? 'true' : 'false',
          },
          h('span', { className: 'tb-checkMark', 'aria-hidden': true }, check.ok === true ? '●' : '○'),
          h('span', null, check.label)))),
        typeof task.note === 'string' && task.note !== '' ? h('p', { className: 'tb-note' }, task.note) : null)
    }

    function TeamBoardPage(props) {
      const call = props.call
      const t = typeof props.t === 'function' ? props.t : (key) => key
      const [snapshot, setSnapshot] = React.useState({ phase: 'loading', board: null, error: null })
      const [drafts, setDrafts] = React.useState({})
      const [submitting, setSubmitting] = React.useState('')
      const [notice, setNotice] = React.useState(null)
      const [refreshing, setRefreshing] = React.useState(false)
      const live = React.useRef(true)
      const busy = React.useRef(false)

      const load = React.useCallback(async (signal) => {
        if (busy.current) return
        busy.current = true
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

      React.useEffect(() => {
        live.current = true
        load()
        const timer = window.setInterval(() => { void load() }, POLL_MS)
        const onFocus = () => { void load() }
        window.addEventListener('focus', onFocus)
        return () => {
          live.current = false
          window.clearInterval(timer)
          window.removeEventListener('focus', onFocus)
        }
      }, [load])

      const refresh = async () => {
        setRefreshing(true)
        await load()
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

      const board = snapshot.board
      const projects = Array.isArray(board?.projects) ? board.projects : []
      const decisions = Array.isArray(board?.decisions) ? board.decisions : []
      const tasks = Array.isArray(board?.tasks) ? board.tasks : []
      const project = projects.find((entry) => entry.status === 'active') ?? projects[0] ?? null
      const projectDecisions = decisions.filter((entry) => project === null || entry.projectId === project.id)
      const orderedDecisions = projectDecisions
        .map((entry, index) => ({ entry, index }))
        .sort((left, right) => {
          const leftOpen = left.entry.status === 'open' ? 0 : 1
          const rightOpen = right.entry.status === 'open' ? 0 : 1
          return leftOpen - rightOpen || left.index - right.index
        })
      const projectTasks = tasks.filter((entry) => project === null || entry.projectId === project.id)
      const openDecisions = projectDecisions.filter((entry) => entry.status === 'open')
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

      return h('div', { className: 'tb-page' },
        h('div', { className: 'tb-inner' },
          h('header', { className: 'tb-head' },
            h('div', null,
              h('h1', { className: 'tb-title' }, project?.name ?? t('page.title')),
              h('p', { className: 'tb-sub' }, summary)),
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
            : orderedDecisions.map(({ entry }, index) => h(DecisionCard, {
              key: entry.id,
              decision: entry,
              index,
              draft: drafts[entry.id],
              submitting: submitting === entry.id,
              onDraft,
              onSubmit: (id) => { void submit(id) },
              t,
            })),
          h('div', { className: 'tb-sectionHead' },
            h('h2', { className: 'tb-sectionTitle' }, t('section.tasks')),
            h('span', { className: 'tb-sectionCount' }, String(projectTasks.length))),
          projectTasks.length === 0
            ? emptyState(t('task.empty'))
            : projectTasks.map((task) => h(TaskCard, {
              key: task.id,
              task,
              onCycle: (entry) => { void cycleStatus(entry) },
              t,
            })),
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
