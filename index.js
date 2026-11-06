/**
 * Host half of the team-board bundle.
 *
 * Owns one durable board file, three model-facing tools, and the small /api
 * RPC surface the Client page calls. Every mutation goes through the same
 * functions the tools use, so the UI and an agent can never disagree about
 * the board's rules.
 */
import { promises as fs } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

const ENDPOINT = 'dsh-team-board'
const RPC_PATH = '/api/dsh-team-board'

const TASK_STATUSES = ['todo', 'doing', 'done']

function boardDirectory() {
  const home = typeof process.env.DSH_HOME === 'string' && process.env.DSH_HOME.trim() !== ''
    ? process.env.DSH_HOME
    : path.join(homedir(), '.dsh')
  return path.join(home, 'team-board')
}

function boardFile() {
  return path.join(boardDirectory(), 'board.json')
}

function nowIso() {
  return new Date().toISOString()
}

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

function seedBoard() {
  const createdAt = minutesAgo(42)
  return {
    version: 1,
    updatedAt: nowIso(),
    projects: [
      {
        id: 'P-1',
        name: 'AHP 协作台',
        status: 'active',
        goal: '现在只有「多次对比时」才统计细菌计数，改成：**单次检查做完 AI 分析后，也用同一套计数代码统计这份数据。**',
        currentTask: 'T-078',
        createdAt,
        updatedAt: nowIso(),
      },
    ],
    decisions: [
      {
        id: 'D-1',
        projectId: 'P-1',
        title: '什么时候数',
        detail: '**AI 分析完成后自动数**，跟在分析任务里，不加按钮',
        status: 'open',
        answer: '',
        createdAt,
        answeredAt: null,
      },
      {
        id: 'D-2',
        projectId: 'P-1',
        title: '一次检查有多份媒体时数哪个',
        detail: '**每一份做过 AI 分析的都数**（图片也数）；分析区跟着当前选中的那份显示，报告里每份一行',
        status: 'open',
        answer: '',
        createdAt,
        answeredAt: null,
      },
      {
        id: 'D-3',
        projectId: 'P-1',
        title: '报告里怎么放',
        detail: '在报告 AI 观察部分加一节「细菌计数」：带圈的计数图 + 总数 + 各形态数量，样式照对比报告。**本次检查也加**',
        status: 'open',
        answer: '',
        createdAt,
        answeredAt: null,
      },
      {
        id: 'D-4',
        projectId: 'P-1',
        title: 'AI 方案文字要不要提细菌量',
        detail: '**不动方案文字**，只在分析区和报告里显示数字',
        status: 'open',
        answer: '',
        createdAt,
        answeredAt: null,
      },
    ],
    tasks: [
      {
        id: 'T-078',
        projectId: 'P-1',
        title: '后端：AI 分析后自动统计细菌计数，并提供读取接口',
        status: 'doing',
        commander: 'claude',
        executor: 'deepseek',
        reviewer: 'human',
        progress: { passed: 0, total: 3 },
        checks: [
          { label: '新测试全过：pytest 550 → 只增不减；ruff 0；函数表 0 问题；lean_metrics 超限 0；前端夹具 23/23 不受影响', ok: false },
          { label: '`git diff` 只有 owns 里的文件；`backend/app/counting/**`、`db/models.py`、`migrations/`、`web/**` 0 改动', ok: false },
          { label: '读码：全仓只有 `QuantityService.count_media` 一处调用 `count_video_file` / `count_image_file`', ok: false },
        ],
        note: '',
        createdAt,
        updatedAt: nowIso(),
      },
      {
        id: 'T-079',
        projectId: 'P-1',
        title: '工作台分析区显示细菌计数图',
        status: 'todo',
        commander: 'claude',
        executor: 'deepseek',
        reviewer: 'human',
        progress: { passed: 0, total: 0 },
        checks: [],
        note: '',
        createdAt,
        updatedAt: nowIso(),
      },
    ],
  }
}

/* ------------------------------------------------------------------ */
/* Durable store                                                       */
/* ------------------------------------------------------------------ */

let cached
let writeChain = Promise.resolve()
let loading

/** Serialize every mutation so two callers cannot interleave writes. */
function serialize(work) {
  const run = writeChain.then(work, work)
  writeChain = run.then(() => undefined, () => undefined)
  return run
}

function normalizeBoard(value) {
  const board = value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return {
    version: 1,
    updatedAt: typeof board.updatedAt === 'string' ? board.updatedAt : nowIso(),
    projects: Array.isArray(board.projects) ? board.projects : [],
    decisions: Array.isArray(board.decisions) ? board.decisions : [],
    tasks: Array.isArray(board.tasks) ? board.tasks : [],
  }
}

async function persist(board) {
  await fs.mkdir(boardDirectory(), { recursive: true })
  const file = boardFile()
  const temporary = `${file}.${process.pid}.tmp`
  await fs.writeFile(temporary, `${JSON.stringify(board, null, 2)}\n`, 'utf8')
  await fs.rename(temporary, file)
  cached = board
}

async function loadBoard() {
  const file = boardFile()
  let raw
  try {
    raw = await fs.readFile(file, 'utf8')
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    const seeded = seedBoard()
    await persist(seeded)
    return seeded
  }
  try {
    cached = normalizeBoard(JSON.parse(raw))
    return cached
  } catch (error) {
    // Keep the unreadable file for inspection instead of silently losing it.
    const backup = `${file}.corrupt-${Date.now()}.json`
    await fs.rename(file, backup).catch(() => undefined)
    const seeded = seedBoard()
    await persist(seeded)
    return seeded
  }
}

async function readBoard() {
  if (cached !== undefined) return cached
  // One first-read at a time: a concurrent second caller must not seed twice.
  if (loading === undefined) {
    loading = loadBoard().finally(() => { loading = undefined })
  }
  return loading
}

/* ------------------------------------------------------------------ */
/* Validation helpers                                                  */
/* ------------------------------------------------------------------ */

function text(value, field, options = {}) {
  const { max = 4000, required = false } = options
  if (value === undefined || value === null) {
    if (required) throw new Error(`${field} is required`)
    return undefined
  }
  if (typeof value !== 'string') throw new Error(`${field} must be a string`)
  const trimmed = value.trim()
  if (required && trimmed === '') throw new Error(`${field} must not be empty`)
  if (trimmed.length > max) throw new Error(`${field} exceeds ${max} characters`)
  return trimmed
}

function optionalNumber(value, field) {
  if (value === undefined || value === null) return undefined
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${field} must be a non-negative number`)
  return Math.trunc(parsed)
}

function projectOf(board, projectId) {
  if (projectId !== undefined) {
    const found = board.projects.find((project) => project.id === projectId)
    if (found === undefined) throw new Error(`unknown project ${projectId}`)
    return found
  }
  if (board.projects.length === 0) throw new Error('the board has no project yet')
  return board.projects[0]
}

function nextId(items, prefix, digits) {
  let highest = 0
  for (const item of items) {
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(String(item.id ?? ''))
    if (match !== null) highest = Math.max(highest, Number(match[1]))
  }
  return `${prefix}-${String(highest + 1).padStart(digits, '0')}`
}

/* ------------------------------------------------------------------ */
/* Operations (shared by tools and the Client RPC)                     */
/* ------------------------------------------------------------------ */

async function getState() {
  const board = await readBoard()
  return { board }
}

async function readProject(projectId) {
  const board = await readBoard()
  if (projectId !== undefined) {
    const project = board.projects.find((entry) => entry.id === projectId)
    if (project === undefined) throw new Error(`unknown project ${projectId}`)
    return {
      project,
      decisions: board.decisions.filter((decision) => decision.projectId === project.id),
      tasks: board.tasks.filter((task) => task.projectId === project.id),
    }
  }
  return { projects: board.projects, decisions: board.decisions, tasks: board.tasks }
}

async function answerDecision(input) {
  const id = text(input?.id, 'id', { required: true, max: 64 })
  const answer = text(input?.answer, 'answer', { required: true, max: 4000 })
  return serialize(async () => {
    const board = await readBoard()
    const decision = board.decisions.find((entry) => entry.id === id)
    if (decision === undefined) throw new Error(`unknown decision ${id}`)
    if (decision.status === 'answered') throw new Error(`decision ${id} is already answered`)
    decision.status = 'answered'
    decision.answer = answer
    decision.answeredAt = nowIso()
    board.updatedAt = nowIso()
    await persist(board)
    return { board }
  })
}

async function setTaskStatus(input) {
  const id = text(input?.id, 'id', { required: true, max: 64 })
  const status = text(input?.status, 'status', { required: true, max: 16 })
  if (!TASK_STATUSES.includes(status)) throw new Error(`status must be one of ${TASK_STATUSES.join(', ')}`)
  return serialize(async () => {
    const board = await readBoard()
    const task = board.tasks.find((entry) => entry.id === id)
    if (task === undefined) throw new Error(`unknown task ${id}`)
    task.status = status
    task.updatedAt = nowIso()
    board.updatedAt = nowIso()
    await persist(board)
    return { board }
  })
}

async function toggleCheck(input) {
  const taskId = text(input?.taskId, 'taskId', { required: true, max: 64 })
  const index = input?.index
  if (!Number.isInteger(index)) throw new Error('index is required and must be an integer')
  const ok = input?.ok
  if (ok !== undefined && typeof ok !== 'boolean') throw new Error('ok must be a boolean')
  return serialize(async () => {
    const board = await readBoard()
    const task = board.tasks.find((entry) => entry.id === taskId)
    if (task === undefined) throw new Error(`unknown task ${taskId}`)
    const checks = Array.isArray(task.checks) ? task.checks : []
    if (index < 0 || index >= checks.length) throw new Error(`index ${index} is out of range`)
    checks[index].ok = ok === undefined ? checks[index].ok !== true : ok
    task.progress = { passed: checks.filter((entry) => entry.ok === true).length, total: checks.length }
    task.updatedAt = nowIso()
    board.updatedAt = nowIso()
    await persist(board)
    return { board }
  })
}

async function createProject(input) {
  const name = text(input?.name, 'name', { required: true, max: 120 })
  const goal = text(input?.goal, 'goal', { max: 4000 }) ?? ''
  return serialize(async () => {
    const board = await readBoard()
    const project = {
      id: nextId(board.projects, 'P', 1),
      name,
      status: 'active',
      goal,
      currentTask: '',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    board.projects.push(project)
    board.updatedAt = nowIso()
    await persist(board)
    return { board, project: { ...project } }
  })
}

async function upsertTask(input) {
  const requestedId = text(input?.taskId, 'taskId', { max: 64 })
  const title = text(input?.title, 'title', { max: 200 })
  const note = text(input?.note, 'note', { max: 4000 })
  const commander = text(input?.commander, 'commander', { max: 64 })
  const executor = text(input?.executor, 'executor', { max: 64 })
  const reviewer = text(input?.reviewer, 'reviewer', { max: 64 })
  const status = text(input?.status, 'status', { max: 16 })
  if (status !== undefined && !TASK_STATUSES.includes(status)) {
    throw new Error(`status must be one of ${TASK_STATUSES.join(', ')}`)
  }
  const passed = optionalNumber(input?.progressPassed, 'progressPassed')
  const total = optionalNumber(input?.progressTotal, 'progressTotal')
  const checks = Array.isArray(input?.checks)
    ? input.checks.map((entry) => {
      const label = text(typeof entry === 'string' ? entry : entry?.label, 'checks[].label', { required: true, max: 500 })
      const ok = typeof entry === 'object' && entry !== null && entry.ok === true
      return { label, ok }
    })
    : undefined
  const doneChecks = Array.isArray(input?.doneChecks)
    ? input.doneChecks.map((entry) => text(entry, 'doneChecks[]', { required: true, max: 500 }))
    : undefined

  return serialize(async () => {
    const board = await readBoard()
    const project = projectOf(board, text(input?.projectId, 'projectId', { max: 64 }))
    let task
    if (requestedId !== undefined) {
      task = board.tasks.find((entry) => entry.id === requestedId)
      if (task === undefined) throw new Error(`unknown task ${requestedId}`)
    } else {
      if (title === undefined) throw new Error('title is required when creating a task')
      task = {
        id: nextId(board.tasks, 'T', 3),
        projectId: project.id,
        title,
        status: 'todo',
        commander: 'claude',
        executor: 'deepseek',
        reviewer: 'human',
        progress: { passed: 0, total: 0 },
        checks: [],
        note: '',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      board.tasks.push(task)
    }

    if (title !== undefined) task.title = title
    if (status !== undefined) task.status = status
    if (commander !== undefined) task.commander = commander
    if (executor !== undefined) task.executor = executor
    if (reviewer !== undefined) task.reviewer = reviewer
    if (note !== undefined) task.note = note
    if (passed !== undefined || total !== undefined) {
      const current = task.progress ?? { passed: 0, total: 0 }
      task.progress = { passed: passed ?? current.passed ?? 0, total: total ?? current.total ?? 0 }
    }
    if (checks !== undefined) {
      const previous = new Map((task.checks ?? []).map((entry) => [entry.label, entry.ok === true]))
      task.checks = checks.map((entry) => ({ label: entry.label, ok: previous.get(entry.label) === true || entry.ok }))
    }
    if (doneChecks !== undefined) {
      const marks = new Set(doneChecks)
      task.checks = (task.checks ?? []).map((entry) => ({ ...entry, ok: entry.ok || marks.has(entry.label) }))
    }
    task.updatedAt = nowIso()
    board.updatedAt = nowIso()
    await persist(board)
    return { task: { ...task }, board }
  })
}

async function askDecision(input) {
  const title = text(input?.title, 'title', { required: true, max: 200 })
  const detail = text(input?.detail, 'detail', { max: 4000 }) ?? ''
  return serialize(async () => {
    const board = await readBoard()
    const project = projectOf(board, text(input?.projectId, 'projectId', { max: 64 }))
    const decision = {
      id: nextId(board.decisions, 'D', 1),
      projectId: project.id,
      title,
      detail,
      status: 'open',
      answer: '',
      createdAt: nowIso(),
      answeredAt: null,
    }
    board.decisions.push(decision)
    board.updatedAt = nowIso()
    await persist(board)
    return { decision: { ...decision }, board }
  })
}

/* ------------------------------------------------------------------ */
/* Agent tools                                                         */
/* ------------------------------------------------------------------ */

function boardOutput(render) {
  return {
    schema: { type: 'object', additionalProperties: true },
    render,
  }
}

function registerTools(ctx) {
  ctx.effect(() => ctx.tools.register({
    name: 'collab_board_read',
    description: 'Read the human collaboration board (协作台): projects with their goal and current task, decision cards awaiting the human (待拍板) together with the answer once one is given, and tasks with commander/executor/reviewer roles, status, progress, acceptance checks and note. Call it before picking up board work and again before reporting, so status and evidence stay current.',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Optional project id. Omit to read the whole board.' },
      },
      additionalProperties: false,
    },
    output: boardOutput((_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }]),
    async execute(args) {
      return readProject(args?.projectId)
    },
  }), 'team-board: collab_board_read')

  ctx.effect(() => ctx.tools.register({
    name: 'collab_task_upsert',
    description: 'Create or update one task on the human collaboration board (协作台). Omit taskId to create the next task id; pass taskId to update roles, status, progress, acceptance checks or the note. Checks keep their done state when the same label is passed again, so re-send the full check list with doneChecks naming the ones you have just proven.',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Existing task id such as T-078. Omit to create a task.' },
        projectId: { type: 'string', description: 'Project id; defaults to the first project.' },
        title: { type: 'string', description: 'Task title. Required when creating.' },
        status: { type: 'string', enum: TASK_STATUSES, description: 'todo, doing or done.' },
        commander: { type: 'string', description: 'Who directs the task.' },
        executor: { type: 'string', description: 'Who executes it.' },
        reviewer: { type: 'string', description: 'Who accepts it.' },
        progressPassed: { type: 'number', description: 'Passed acceptance checks.' },
        progressTotal: { type: 'number', description: 'Required acceptance checks.' },
        checks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Full replacement acceptance-check list. Existing done marks survive by label.',
        },
        doneChecks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels of checks that now pass.',
        },
        note: { type: 'string', description: 'Free-form status note shown on the card.' },
      },
      additionalProperties: false,
    },
    output: boardOutput((_args, value) => [{ type: 'text', text: JSON.stringify(value?.task ?? value, null, 2) }]),
    async execute(args) {
      return upsertTask(args)
    },
  }), 'team-board: collab_task_upsert')

  ctx.effect(() => ctx.tools.register({
    name: 'collab_decision_ask',
    description: 'Post one 待拍板 card on the human collaboration board (协作台) when a decision blocks your work. The human answers it in the board page; read the answer back with collab_board_read. Use one card per decision and keep the title short.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short question title.' },
        detail: { type: 'string', description: 'Context the human needs to decide. **bold** is supported.' },
        projectId: { type: 'string', description: 'Project id; defaults to the first project.' },
      },
      required: ['title'],
      additionalProperties: false,
    },
    output: boardOutput((_args, value) => [{ type: 'text', text: JSON.stringify(value?.decision ?? value, null, 2) }]),
    async execute(args) {
      return askDecision(args)
    },
  }), 'team-board: collab_decision_ask')
}

/* ------------------------------------------------------------------ */
/* Client RPC                                                          */
/* ------------------------------------------------------------------ */

const OPERATIONS = {
  state: () => getState(),
  answerDecision,
  setTaskStatus,
  toggleCheck,
  createProject,
  upsertTask,
}

function reply(rpcId, result) {
  return Response.json({ type: 'server-response', rpcId, result })
}

function registerRpc(ctx) {
  const connection = ctx.connection
  if (typeof connection?.fetch?.register !== 'function') return
  const stop = connection.fetch.register({
    path: RPC_PATH,
    methods: ['POST'],
    requestBody: 'buffered',
    async fetch(request) {
      if (request.method !== 'POST') return new Response('method not allowed', { status: 405 })
      const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
      if (contentType !== 'application/json') return new Response('content type must be application/json', { status: 415 })
      let message
      try {
        message = await request.json()
      } catch {
        return new Response('body is not JSON', { status: 400 })
      }
      const call = message?.payload
      const rpcId = typeof message?.rpcId === 'string' ? message.rpcId : 'invalid-request'
      if (
        message === null || typeof message !== 'object'
        || message.type !== 'client-request'
        || typeof message.rpcId !== 'string'
        || message.method !== ENDPOINT
        || call === null || typeof call !== 'object'
        || typeof call.method !== 'string'
        || !Object.hasOwn(call, 'payload')
      ) {
        return reply(rpcId, { ok: false, error: { code: 'team-board/bad-request', message: 'Invalid team board request.', details: {} } })
      }
      const operation = OPERATIONS[call.method]
      if (typeof operation !== 'function') {
        return reply(rpcId, { ok: false, error: { code: 'team-board/unknown-method', message: `Unknown board operation ${call.method}`, details: {} } })
      }
      try {
        return reply(rpcId, { ok: true, value: await operation(call.payload) })
      } catch (error) {
        return reply(rpcId, {
          ok: false,
          error: {
            code: 'team-board/failed',
            message: String(error?.message ?? error),
            details: {},
          },
        })
      }
    },
  })
  ctx.effect(() => stop, 'team-board: rpc route')
}

/* ------------------------------------------------------------------ */
/* Entry                                                               */
/* ------------------------------------------------------------------ */

export function apply(ctx) {
  ctx.effect(() => {
    void readBoard().catch((error) => {
      ctx.logger?.warn?.('team-board: failed to prepare the board file', error)
    })
    return () => {}
  }, 'team-board: prepare board file')
  registerTools(ctx)
  registerRpc(ctx)
}

export const inject = ['tools', 'connection']
