/** Execute the real Client handlers with a minimal hook runtime, without a browser. */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
const storage = new Map()
const sessionStorage = {
  getItem: key => storage.get(key),
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
}
const board = {
  projects: [{ id: 'P-1', name: 'Test', status: 'active', goal: '' }], decisions: [],
  tasks: [{ id: 'T-1', projectId: 'P-1', title: 'Task', status: 'todo', checks: [] }],
}
let serial = 0
function page(call, rpcCall) {
  const hooks = []
  let cursor = 0
  const React = {
    createElement(type, props, ...children) { return { type, props: props ?? {}, children } },
    useState(initial) {
      const index = cursor++
      if (!(index in hooks)) hooks[index] = index === 0 ? { phase: 'ready', board, error: null } : initial
      return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value }]
    },
    useRef(initial) {
      const index = cursor++
      return hooks[index] ??= { current: initial }
    },
    useCallback(fn) { return fn },
    useEffect() {},
  }
  let plugin, Component, injectedCall
  vm.runInNewContext(source, {
    window: { __ModuleLoader__: { load: config => { plugin = config.factory(() => React) } }, sessionStorage, crypto: { randomUUID: () => `client-${++serial}` } },
    document: {},
  })
  plugin.apply({
    locale: { bind: () => key => key },
    connection: { rpc: { call: rpcCall } },
    effect(fn, label) { if (label === 'team-board: main page') fn() },
    slots: { inject(_name, fn) { return fn() }, register(options, component) { Component = component; injectedCall = options.inject?.().call } },
  })
  function find(node, name) {
    if (!node || typeof node !== 'object') return undefined
    if (node.type?.name === name || node.props?.className === name) return node.props
    for (const child of (node.children ?? []).flat(Infinity)) {
      const result = find(child, name)
      if (result) return result
    }
  }
  const render = name => {
    cursor = 0
    return find(Component({ call: call ?? injectedCall, t: key => key }), name)
  }
  render.snapshot = () => hooks[0]
  return render
}
const flush = () => new Promise(resolve => setImmediate(resolve))
for (const method of ['sendMessage', 'dispatchTask']) {
  storage.clear()
  const requests = []
  let outcome = 'lost'
  const call = async (name, payload) => {
    if (name === 'listSessions') return { sessions: [{ id: 'live', title: 'Live' }] }
    assert.equal(name, method)
    requests.push(payload.requestId)
    if (outcome === 'lost') throw new Error('response lost')
    return { board, delivery: { status: 'sent' }, ...(outcome === 'warning' ? { warning: 'Check session' } : {}) }
  }
  let render = page(call)
  async function send() {
    if (method === 'sendMessage') {
      render('ComposePanel').onChangeTarget('live')
      render('ComposePanel').onChangeText('hello')
      render('ComposePanel').onSend()
    } else {
      render('TaskCard').onOpenDispatch(board.tasks[0])
      await flush()
      render('TaskCard').onDispatchTarget('live')
      render('TaskCard').onDispatchSubmit()
    }
    await flush()
  }
  await send()
  await send()
  assert.equal(requests[0], requests[1], `${method}: retry reuses ID after a lost response`)
  render = page(call)
  outcome = 'warning'
  await send()
  assert.equal(requests[0], requests[2], `${method}: reload retains pending ID`)
  await send()
  assert.equal(requests[0], requests[3], `${method}: warning retains pending ID`)
  outcome = 'success'
  await send()
  await send()
  assert.notEqual(requests[4], requests[5], `${method}: confirmed success permits a new intentional send`)
  console.log(`  ok   ${method}: retry, reload, warning, and next intentional send`)
}
// Resolve real page-handler RPC promises in reverse order.
const pending = []
const render = page((method, payload) => {
  if (method === 'listSessions') return Promise.resolve({ sessions: [] })
  return new Promise(resolve => pending.push({ method, payload, resolve }))
})
const snapshot = (revision, status) => ({ board: { ...board, revision, updatedAt: '2026-11-11T00:00:00.000Z', tasks: [{ ...board.tasks[0], status }] } })
render('tb-refresh').onClick()
render('TaskCard').onCycle(board.tasks[0])
assert.equal(pending[0].method, 'state')
assert.equal(pending[1].method, 'setTaskStatus')
pending[1].resolve(snapshot(12, 'doing'))
await flush()
pending[0].resolve(snapshot(11, 'todo'))
await flush()
assert.equal(render('TaskCard').task.status, 'doing', 'old poll cannot undo a completed mutation')
assert.equal(render.snapshot().board.revision, 12, 'poll cannot lower snapshot revision')
console.log('  ok   delayed polling response cannot overwrite newer mutation')

render('TaskCard').onCycle({ ...board.tasks[0], status: 'todo' })
render('TaskCard').onCycle({ ...board.tasks[0], status: 'doing' })
pending[3].resolve(snapshot(14, 'done'))
await flush()
pending[2].resolve(snapshot(13, 'doing'))
await flush()
assert.equal(render('TaskCard').task.status, 'done', 'old mutation response cannot undo a newer mutation')
assert.equal(render.snapshot().board.revision, 14, 'same-timestamp updates are ordered by revision')
console.log('  ok   reversed mutation responses keep newest revision even with equal timestamps')

render('tb-refresh').onClick()
pending[4].resolve(snapshot(15, 'todo'))
await flush()
assert.equal(render('TaskCard').task.status, 'todo', 'newer poll still updates the board')
assert.equal(render.snapshot().board.revision, 15)
console.log('  ok   a newer poll still updates the board')
// Exercise the actual plugin boundary, not the page's already-unwrapped mock.
let rpcResult = { ok: true, value: snapshot(20, 'done') }
const boundary = page(undefined, async (path, endpoint, call) => {
  assert.equal(path, '/api')
  assert.equal(endpoint, 'dsh-team-board')
  return call.method === 'listSessions' ? { ok: true, value: { sessions: [] } } : rpcResult
})
boundary('tb-refresh').onClick()
await flush()
assert.equal(boundary('TaskCard').task.status, 'done', 'RPC success envelope is unwrapped before updating the page')
assert.equal(boundary.snapshot().board.revision, 20)
rpcResult = { ok: false, error: { message: 'host rejected request' } }
boundary('tb-refresh').onClick()
await flush()
assert.equal(boundary.snapshot().error, 'host rejected request', 'RPC errors reach the page')
rpcResult = {}
boundary('tb-refresh').onClick()
await flush()
assert.equal(boundary.snapshot().error, 'Invalid team board response', 'malformed RPC envelope is rejected')
console.log('  ok   real Client RPC boundary unwraps success and rejects Host / malformed errors')
console.log('\n18 CLIENT RETRY / SNAPSHOT / RPC CHECKS PASSED')
