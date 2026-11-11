/** Multi-project routing, task validation and durable board revision checks. */
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const home = await fs.mkdtemp(path.join(os.tmpdir(), 'team-board-rules-'))
process.env.DSH_HOME = home
const file = path.join(home, 'team-board', 'board.json')
let sequence = 0
const inbox = []
const agent = { session: { header: { id: 'worker', origin: 'user' } }, status: 'idle', followup: message => inbox.push(message) }
let checks = 0
function check(label, condition) {
  assert.ok(condition, label)
  checks++
  console.log(`  ok   ${label}`)
}
async function host() {
  let route
  const tools = new Map()
  const { apply } = await import(`../index.js?rules=${++sequence}`)
  apply({
    effect(fn) { fn(); return () => {} },
    tools: { register(tool) { tools.set(tool.name, tool); return () => {} } },
    get: name => name === 'agents' ? { get: () => agent } : undefined,
    connection: { fetch: { register(value) { route = value; return () => {} } } },
  })
  return {
    tools,
    async rpc(method, payload = {}) {
      const response = await route.fetch(new Request('http://localhost/api/dsh-team-board', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'client-request', rpcId: 'test', method: 'dsh-team-board', payload: { method, payload } }),
      }))
      return (await response.json()).result
    },
  }
}
try {
  let h = await host()
  const initial = (await h.rpc('state')).value.board
  check('new board has a revision', Number.isSafeInteger(initial.revision) && initial.revision > 0)
  const ask = args => h.tools.get('collab_decision_ask').execute(args, { agent })
  const legacy = await ask({ title: 'single project' })
  check('single-project default stays compatible', legacy.decision.projectId === 'P-1')
  const project = (await h.rpc('createProject', { name: 'Second' })).value.project
  const task = (await h.rpc('upsertTask', { projectId: project.id, title: 'Work' })).value.task
  await assert.rejects(() => ask({ title: 'ambiguous' }), /multiple projects/)
  check('unbound multi-project question is rejected', true)
  await h.rpc('dispatchTask', { taskId: task.id, sessionId: 'worker', requestId: 'dispatch-second' })
  const prompt = inbox.at(-1).content[0].text
  check('dispatch prompt includes exact task and project arguments', prompt.includes(JSON.stringify({ taskId: task.id, projectId: project.id })) && prompt.includes('collab_decision_ask'))
  const inferred = await ask({ title: 'question from executor' })
  check('omitted project is inferred from the session dispatch', inferred.decision.projectId === project.id && inferred.decision.taskId === task.id)
  const explicit = await ask({ title: 'linked question', taskId: task.id })
  check('taskId determines decision project', explicit.decision.taskId === task.id && explicit.decision.projectId === project.id)
  await assert.rejects(() => ask({ title: 'wrong project', taskId: task.id, projectId: 'P-1' }), /does not belong/)
  check('decision rejects mismatched task and project', true)
  await assert.rejects(() => ask({ title: 'missing task', taskId: 'missing' }), /unknown task/)
  check('decision rejects unknown task', true)
  await h.rpc('dispatchTask', { taskId: 'T-079', sessionId: 'worker', requestId: 'dispatch-other' })
  await assert.rejects(() => ask({ title: 'two possible tasks' }), /multiple active tasks/)
  check('multiple active dispatches require explicit context', true)
  const chosen = await ask({ title: 'explicit project', projectId: project.id })
  check('explicit project resolves ambiguous session without inventing a task', chosen.decision.projectId === project.id && chosen.decision.taskId === undefined)
  await h.rpc('setTaskStatus', { id: 'T-079', status: 'done' })
  check('finished dispatch no longer makes routing ambiguous', (await ask({ title: 'remaining active task' })).decision.taskId === task.id)
  const updated = await h.rpc('upsertTask', { taskId: task.id, note: 'update without project' })
  check('task update keeps its existing project', updated.ok && updated.value.task.projectId === project.id)
  check('task update rejects another project', !(await h.rpc('upsertTask', { taskId: task.id, projectId: 'P-1', note: 'wrong' })).ok)

  const invalid = [
    { title: '   ' }, { taskId: task.id, title: '\n ' },
    { title: 'Count', progressPassed: 100, progressTotal: 1 },
    { title: 'Count', progressPassed: -1 }, { title: 'Count', progressTotal: 1.5 },
    { title: 'Count', progressTotal: '2' }, { title: 'Count', progressPassed: true },
    { title: 'Count', progressTotal: null }, { title: 'Count', progressTotal: Number.MAX_SAFE_INTEGER + 1 },
    { title: 'Checks', checks: 'oops' }, { title: 'Checks', doneChecks: {} },
  ]
  const before = (await h.rpc('state')).value.board
  for (const payload of invalid) {
    check(`invalid task rejected: ${JSON.stringify(payload)}`, !(await h.rpc('upsertTask', payload)).ok)
  }
  assert.deepEqual((await h.rpc('state')).value.board, before)
  check('invalid requests leave data and revision unchanged', true)
  const counted = (await h.rpc('upsertTask', { title: 'Manual progress', progressPassed: 1, progressTotal: 3 })).value.task
  check('valid manual progress remains supported', counted.progress.passed === 1 && counted.progress.total === 3)
  check('partial progress cannot lower total below passed', !(await h.rpc('upsertTask', { taskId: counted.id, progressTotal: 0 })).ok)
  const checklist = (await h.rpc('upsertTask', { title: 'Checklist', checks: ['A', 'B'], doneChecks: ['A'] })).value.task
  const override = (await h.rpc('upsertTask', { taskId: checklist.id, progressPassed: 100, progressTotal: 1 })).value.task
  check('existing checklist overrides manual progress', override.progress.passed === 1 && override.progress.total === 2)

  const saved = (await h.rpc('state')).value.board
  const disk = JSON.parse(await fs.readFile(file, 'utf8'))
  check('response revision matches persisted revision', saved.revision === disk.revision && saved.revision > initial.revision)
  h = await host()
  check('revision survives restart', (await h.rpc('state')).value.board.revision === saved.revision)
  const next = await h.rpc('setTaskStatus', { id: task.id, status: 'done' })
  check('revision increments after restart', next.value.board.revision === saved.revision + 1)
  const writeFile = fs.writeFile
  fs.writeFile = async () => { throw new Error('disk full') }
  try { check('failed save reports error', !(await h.rpc('setTaskStatus', { id: task.id, status: 'todo' })).ok) }
  finally { fs.writeFile = writeFile }
  check('failed save does not advance cached revision', (await h.rpc('state')).value.board.revision === next.value.board.revision)
  const old = JSON.parse(await fs.readFile(file, 'utf8'))
  delete old.revision
  delete old.tasks.find(entry => entry.id === counted.id).progress
  await fs.writeFile(file, JSON.stringify(old))
  h = await host()
  check('old board without revision loads as revision zero', (await h.rpc('state')).value.board.revision === 0)
  check('old board receives revision on next save', (await h.rpc('setTaskStatus', { id: task.id, status: 'todo' })).value.board.revision === 1)
  check('legacy task without progress remains editable', (await h.rpc('upsertTask', { taskId: counted.id, note: 'legacy update' })).value.task.progress.total === 0)
  console.log(`\n${checks} BOARD RULE CHECKS PASSED`)
} finally {
  await fs.rm(home, { recursive: true, force: true })
}
