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
function page(call) {
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
  let plugin, Component
  vm.runInNewContext(source, {
    window: { __ModuleLoader__: { load: config => { plugin = config.factory(() => React) } }, sessionStorage, crypto: { randomUUID: () => `client-${++serial}` } },
    document: {},
  })
  plugin.apply({
    locale: { bind: () => key => key },
    effect(fn, label) { if (label === 'team-board: main page') fn() },
    slots: { inject(_name, fn) { return fn() }, register(_options, component) { Component = component } },
  })
  function find(node, name) {
    if (!node || typeof node !== 'object') return undefined
    if (node.type?.name === name) return node.props
    for (const child of (node.children ?? []).flat(Infinity)) {
      const result = find(child, name)
      if (result) return result
    }
  }
  return name => {
    cursor = 0
    return find(Component({ call, t: key => key }), name)
  }
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
console.log('\n8 CLIENT RETRY CHECKS PASSED')
