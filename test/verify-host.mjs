/**
 * Throwaway harness: load the Host half with a fake Cordis context, drive the
 * exact /api handler the Client page calls, and assert on the resulting board.
 * Uses a temporary DSH_HOME so the real board file is untouched.
 */
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const home = await mkdtemp(path.join(tmpdir(), 'team-board-check-'))
process.env.DSH_HOME = home

const { apply } = await import('../index.js')

const tools = new Map()
let route
const disposers = []
const ctx = {
  effect: (fn) => {
    const disposer = fn()
    if (typeof disposer === 'function') disposers.push(disposer)
    return () => {}
  },
  tools: { register: (definition) => { tools.set(definition.name, definition); return () => {} } },
  connection: { fetch: { register: (registered) => { route = registered; return () => {} } } },
  logger: { warn: (...args) => console.warn('[host warn]', ...args) },
}

apply(ctx)

let failures = 0
function check(label, condition, detail) {
  if (condition) {
    console.log(`  ok   ${label}`)
  } else {
    failures += 1
    console.log(`  FAIL ${label}${detail === undefined ? '' : ` :: ${JSON.stringify(detail)}`}`)
  }
}

async function rpc(method, payload, options = {}) {
  const body = options.raw ?? JSON.stringify({
    type: 'client-request',
    rpcId: options.rpcId ?? 'rpc-1',
    method: options.method ?? 'dsh-team-board',
    payload: { method, payload: payload ?? {} },
  })
  const response = await route.fetch(new Request('http://127.0.0.1/api/dsh-team-board', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  }))
  const statusCode = response.status
  const text = await response.text()
  let json
  try { json = JSON.parse(text) } catch { json = undefined }
  return { statusCode, json, text }
}

const [first, second] = await Promise.all([rpc('state'), rpc('state')])
check('concurrent first reads agree', first.json?.result?.ok === true && second.json?.result?.ok === true && first.json?.result?.value?.board?.tasks?.length === 2 && second.json?.result?.value?.board?.tasks?.length === 2, [first.json?.result?.ok, second.json?.result?.ok])

console.log(`temp home: ${home}`)
console.log(`tools registered: ${[...tools.keys()].join(', ')}`)
console.log(`route: ${route?.path} ${route?.methods} ${route?.requestBody}`)

check('three tools registered', tools.size === 3, [...tools.keys()])
check('route registered', route?.path === '/api/dsh-team-board')

const state = await rpc('state')
check('state -> 200', state.statusCode === 200, state.statusCode)
check('state -> ok envelope', state.json?.result?.ok === true, state.json)
check('state seeds four decisions', state.json?.result?.value?.board?.decisions?.length === 4, state.json?.result?.value?.board?.decisions?.length)
check('state seeds T-078 doing', state.json?.result?.value?.board?.tasks?.find((task) => task.id === 'T-078')?.status === 'doing')

const answered = await rpc('answerDecision', { id: 'D-1', answer: '分析完成后自动数' })
check('answerDecision -> ok', answered.json?.result?.ok === true, answered.json)
const decision = answered.json?.result?.value?.board?.decisions?.find((entry) => entry.id === 'D-1')
check('decision answered', decision?.status === 'answered' && decision?.answer === '分析完成后自动数', decision)
check('decision is persisted', (await readFile(path.join(home, 'team-board', 'board.json'), 'utf8')).includes('分析完成后自动数'))

const again = await rpc('answerDecision', { id: 'D-1', answer: 'again' })
check('re-answer rejected', again.json?.result?.ok === false && /already answered/u.test(again.json?.result?.error?.message ?? ''), again.json)

const blank = await rpc('answerDecision', { id: 'D-2', answer: '   ' })
check('blank answer rejected', blank.json?.result?.ok === false, blank.json)

const status = await rpc('setTaskStatus', { id: 'T-078', status: 'done' })
check('setTaskStatus -> done', status.json?.result?.value?.board?.tasks?.find((task) => task.id === 'T-078')?.status === 'done', status.json)

const badStatus = await rpc('setTaskStatus', { id: 'T-078', status: 'shipped' })
check('bad status rejected', badStatus.json?.result?.ok === false, badStatus.json)

const asked = await rpc('unknownOperation', {})
check('unknown operation -> coded error', asked.json?.result?.ok === false && asked.json?.result?.error?.code === 'team-board/unknown-method', asked.json)

const wrongMethod = await rpc('state', {}, { method: 'someone-else' })
check('foreign method rejected', wrongMethod.json?.result?.ok === false && wrongMethod.json?.result?.error?.code === 'team-board/bad-request', wrongMethod.json)

const badJson = await rpc('state', {}, { raw: '{not json' })
check('bad JSON -> 400', badJson.statusCode === 400, badJson.statusCode)

// --- tools, through the same store -----------------------------------------
const readTool = tools.get('collab_board_read')
const created = await tools.get('collab_task_upsert').execute({
  title: '临时验收任务',
  checks: ['检查 A', '检查 B'],
  progressTotal: 2,
}, { signal: new AbortController().signal })
check('tool creates T-080', created.task.id === 'T-080' && created.task.status === 'todo', created.task)

const updated = await tools.get('collab_task_upsert').execute({
  taskId: 'T-080',
  status: 'doing',
  doneChecks: ['检查 A'],
  progressPassed: 1,
}, { signal: new AbortController().signal })
check('tool keeps check done by label', updated.task.checks[0].ok === true && updated.task.checks[1].ok === false, updated.task.checks)
check('tool keeps progress', updated.task.progress.passed === 1 && updated.task.progress.total === 2, updated.task.progress)

const askedTool = await tools.get('collab_decision_ask').execute({ title: '临时拍板', detail: '**加粗**测试' }, { signal: new AbortController().signal })
check('tool asks a decision -> D-5', askedTool.decision.id === 'D-5' && askedTool.decision.status === 'open', askedTool.decision)

const readBack = await readTool.execute({}, { signal: new AbortController().signal })
check('read tool sees the new task', readBack.tasks.some((task) => task.id === 'T-080'), readBack.tasks.map((task) => task.id))
check('read tool shows the answer', readBack.decisions.find((entry) => entry.id === 'D-1')?.answer === '分析完成后自动数')

const projectOnly = await readTool.execute({ projectId: 'P-1' }, { signal: new AbortController().signal })
check('project read shape', projectOnly.project?.id === 'P-1' && projectOnly.tasks.length === 3, projectOnly.project)

const missingProject = await readTool.execute({ projectId: 'P-9' }, { signal: new AbortController().signal }).then(
  () => 'resolved',
  (error) => error?.message,
)
check('unknown project rejected', missingProject === 'unknown project P-9', missingProject)

// --- toggleCheck RPC --------------------------------------------------------
const flip0 = await rpc('toggleCheck', { taskId: 'T-080', index: 0 })
const t1 = flip0.json?.result?.value?.board?.tasks?.find((task) => task.id === 'T-080')
check('toggleCheck flips a check off', flip0.json?.result?.ok === true && t1?.checks?.[0]?.ok === false, t1?.checks)
check('toggleCheck recomputes progress after flip', t1?.progress?.passed === 0 && t1?.progress?.total === 2, t1?.progress)

const setTrue = await rpc('toggleCheck', { taskId: 'T-080', index: 0, ok: true })
const t2 = setTrue.json?.result?.value?.board?.tasks?.find((task) => task.id === 'T-080')
check('toggleCheck sets ok: true', setTrue.json?.result?.ok === true && t2?.checks?.[0]?.ok === true, t2?.checks)

const setBoth = await rpc('toggleCheck', { taskId: 'T-080', index: 1, ok: true })
const t3 = setBoth.json?.result?.value?.board?.tasks?.find((task) => task.id === 'T-080')
check('toggleCheck recomputes 2/2 with both checked', t3?.progress?.passed === 2 && t3?.progress?.total === 2, t3?.progress)

const setFalse = await rpc('toggleCheck', { taskId: 'T-080', index: 0, ok: false })
const t4 = setFalse.json?.result?.value?.board?.tasks?.find((task) => task.id === 'T-080')
check('toggleCheck sets ok: false', setFalse.json?.result?.ok === true && t4?.checks?.[0]?.ok === false, t4?.checks)

const unknownToggle = await rpc('toggleCheck', { taskId: 'T-999', index: 0 })
check('toggleCheck rejects unknown task', unknownToggle.json?.result?.ok === false && /unknown task/u.test(unknownToggle.json?.result?.error?.message ?? ''), unknownToggle.json)

const rangeToggle = await rpc('toggleCheck', { taskId: 'T-080', index: 99 })
check('toggleCheck rejects out-of-range index', rangeToggle.json?.result?.ok === false && /out of range/u.test(rangeToggle.json?.result?.error?.message ?? ''), rangeToggle.json)

// --- createProject RPC ------------------------------------------------------
const newProject = await rpc('createProject', { name: '  第二项目  ' })
check('createProject assigns P-2', newProject.json?.result?.ok === true && newProject.json?.result?.value?.project?.id === 'P-2', newProject.json?.result?.value?.project)
check('createProject trims the name', newProject.json?.result?.value?.project?.name === '第二项目', newProject.json?.result?.value?.project)
check('createProject defaults goal to empty', newProject.json?.result?.value?.project?.goal === '', newProject.json?.result?.value?.project)
check('created project matches the board', newProject.json?.result?.value?.board?.projects?.some((project) => project.id === 'P-2' && project.name === '第二项目'), newProject.json?.result?.value?.board?.projects?.map((project) => project.id))

const blankName = await rpc('createProject', { name: '   ' })
check('createProject rejects a blank name', blankName.json?.result?.ok === false && /name/u.test(blankName.json?.result?.error?.message ?? ''), blankName.json)

// --- upsertTask RPC ---------------------------------------------------------
const rpcCreated = await rpc('upsertTask', { projectId: 'P-2', title: 'RPC 建任务', checks: ['检查 1', '检查 2'] })
check('upsertTask RPC creates task in requested project', rpcCreated.json?.result?.ok === true && rpcCreated.json?.result?.value?.task?.id === 'T-081' && rpcCreated.json?.result?.value?.task?.projectId === 'P-2', rpcCreated.json?.result?.value?.task)
check('upsertTask RPC returns the board too', rpcCreated.json?.result?.value?.board?.tasks?.some((task) => task.id === 'T-081'), rpcCreated.json?.result?.value?.board?.tasks?.map((task) => task.id))

const rpcUpdated = await rpc('upsertTask', { taskId: 'T-081', doneChecks: ['检查 1'] })
check('upsertTask RPC keeps done check by label', rpcUpdated.json?.result?.value?.task?.checks?.find((entry) => entry.label === '检查 1')?.ok === true && rpcUpdated.json?.result?.value?.task?.checks?.find((entry) => entry.label === '检查 2')?.ok === false, rpcUpdated.json?.result?.value?.task?.checks)

// --- restart persistence ---------------------------------------------------
const { apply: applyAgain } = await import('../index.js?restart=1')
let secondTools = new Map()
let secondRoute
applyAgain({
  effect: (fn) => { fn(); return () => {} },
  tools: { register: (definition) => { secondTools.set(definition.name, definition); return () => {} } },
  connection: { fetch: { register: (registered) => { secondRoute = registered; return () => {} } } },
  logger: { warn: () => {} },
})
const response = await secondRoute.fetch(new Request('http://127.0.0.1/api/dsh-team-board', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ type: 'client-request', rpcId: 'r2', method: 'dsh-team-board', payload: { method: 'state', payload: {} } }),
}))
const reloaded = JSON.parse(await response.text())
check('state survives a fresh module load', reloaded.result.value.board.tasks.some((task) => task.id === 'T-080'), reloaded.result.ok)
check('answered decision survives restart', reloaded.result.value.board.decisions.find((entry) => entry.id === 'D-1')?.status === 'answered')
check('toggled check survives a fresh module load', reloaded.result.value.board.tasks.find((task) => task.id === 'T-080')?.checks?.[0]?.ok === false, reloaded.result.value.board.tasks.find((task) => task.id === 'T-080')?.checks)
check('created project survives a fresh module load', reloaded.result.value.board.projects.some((project) => project.id === 'P-2'), reloaded.result.value.board.projects.map((project) => project.id))
check('upsertTask RPC task survives a fresh module load', reloaded.result.value.board.tasks.some((task) => task.id === 'T-081'), reloaded.result.value.board.tasks.map((task) => task.id))

for (const dispose of disposers) { try { dispose() } catch {} }
await new Promise((resolve) => setTimeout(resolve, 150))
await rm(home, { recursive: true, force: true })
console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exitCode = failures === 0 ? 0 : 1
