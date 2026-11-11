/** Failure injection uses temporary homes only; no real DSH state or sessions. */
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const home = await fs.mkdtemp(path.join(tmpdir(), 'team-board-reliability-'))
process.env.DSH_HOME = home
const file = path.join(home, 'team-board', 'board.json')
const inbox = []
const agent = {
  session: { header: { id: 'live', origin: 'user' } }, status: 'idle',
  followup(message) { inbox.push(message) },
}
let moduleSequence = 0
let checks = 0
function check(label, value) {
  assert.ok(value, label)
  checks++
  console.log(`  ok   ${label}`)
}
async function host() {
  const tools = new Map()
  let route
  const { apply } = await import(`../index.js?reliability=${++moduleSequence}`)
  apply({
    effect(fn) { fn(); return () => {} },
    tools: { register(definition) { tools.set(definition.name, definition); return () => {} } },
    get(name) { return name === 'agents' ? { get: () => agent } : undefined },
    logger: { warn() {} },
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
async function failWrite(number, work) {
  const original = fs.writeFile
  let count = 0
  fs.writeFile = async (...args) => {
    if (++count === number) throw Object.assign(new Error('simulated disk full'), { code: 'ENOSPC' })
    return original(...args)
  }
  try { return await work() } finally { fs.writeFile = original }
}
async function disk() { return JSON.parse(await fs.readFile(file, 'utf8')) }
try {
  let h = await host()
  await h.rpc('state')
  const mutations = [
    ['answerDecision', { id: 'D-1', answer: 'answer' }],
    ['setTaskStatus', { id: 'T-079', status: 'done' }],
    ['toggleCheck', { taskId: 'T-078', index: 0 }],
    ['createProject', { name: 'should not exist' }],
    ['upsertTask', { title: 'should not exist' }],
  ]
  for (const [method, payload] of mutations) {
    const before = (await h.rpc('state')).value.board
    const failed = await failWrite(1, () => h.rpc(method, payload))
    check(`${method}: disk failure is reported`, !failed.ok)
    assert.deepEqual((await h.rpc('state')).value.board, before)
    check(`${method}: cache still matches saved state`, true)
  }
  check('answer can be retried after failed save', (await h.rpc('answerDecision', { id: 'D-1', answer: 'answer' })).ok)

  for (const method of ['dispatchTask', 'sendMessage']) {
    const payload = method === 'dispatchTask'
      ? { taskId: 'T-079', sessionId: 'live', note: method }
      : { taskId: 'T-079', sessionId: 'live', text: method }
    const before = inbox.length
    check(`${method}: missing request ID rejected`, !(await h.rpc(method, payload)).ok)
    const intentFailure = await failWrite(1, () => h.rpc(method, { ...payload, requestId: `${method}-intent` }))
    check(`${method}: failed intent save sends nothing`, !intentFailure.ok && inbox.length === before)
    const request = { ...payload, requestId: `${method}-receipt` }
    const receiptFailure = await failWrite(2, () => h.rpc(method, request))
    check(`${method}: sent message returns success with warning if receipt save fails`, receiptFailure.ok && !!receiptFailure.value.warning && receiptFailure.value.delivery.status === 'sent' && inbox.length === before + 1)
    check(`${method}: pending intent remains on disk`, (await disk()).deliveryRequests.find(entry => entry.id === request.requestId)?.status === 'pending')
    check(`${method}: uncertain retry blocked`, !(await h.rpc(method, request)).ok && inbox.length === before + 1)
    h = await host()
    check(`${method}: uncertain retry blocked after restart`, !(await h.rpc(method, request)).ok && inbox.length === before + 1)
    const success = { ...payload, requestId: `${method}-success` }
    const results = await Promise.all([h.rpc(method, success), h.rpc(method, success)])
    check(`${method}: concurrent identical requests send once`, results.every(result => result.ok) && inbox.length === before + 2)
    h = await host()
    check(`${method}: saved success deduplicates after restart`, (await h.rpc(method, success)).ok && inbox.length === before + 2)
    const conflict = { ...success, sessionId: 'other' }
    check(`${method}: ID reuse with different payload rejected`, !(await h.rpc(method, conflict)).ok)
  }

  const savedAnswer = await h.tools.get('collab_decision_ask').execute({ title: 'intent failure' }, { agent })
  const savedResult = await failWrite(2, () => h.rpc('answerDecision', { id: savedAnswer.decision.id, answer: 'saved' }))
  check('decision: intent failure reports saved answer with warning', savedResult.ok && !!savedResult.value.warning && savedResult.value.board.decisions.find(entry => entry.id === savedAnswer.decision.id).status === 'answered')
  check('decision: intent failure allows explicit delivery retry', (await h.rpc('deliverDecision', { id: savedAnswer.decision.id })).value.delivery.status === 'sent')

  const decision = await h.tools.get('collab_decision_ask').execute({ title: 'receipt failure' }, { agent })
  const answer = await failWrite(3, () => h.rpc('answerDecision', { id: decision.decision.id, answer: 'yes' }))
  check('decision: failed receipt save still reports delivery and warning', answer.ok && !!answer.value.warning && answer.value.delivery.status === 'sent')
  check('decision: answer stays durable', (await disk()).decisions.find(entry => entry.id === decision.decision.id).answer === 'yes')
  const sent = inbox.length
  h = await host()
  check('decision: uncertain resend blocked after restart', !(await h.rpc('deliverDecision', { id: decision.decision.id })).ok && inbox.length === sent)

  const raw = '{"important": BROKEN JSON'
  await fs.writeFile(file, raw)
  const copyFile = fs.copyFile
  fs.copyFile = async () => { throw Object.assign(new Error('backup denied'), { code: 'EPERM' }) }
  try {
    h = await host()
    check('backup failure reports an error', !(await h.rpc('state')).ok)
    check('backup failure preserves original bytes', await fs.readFile(file, 'utf8') === raw)
  } finally { fs.copyFile = copyFile }
  const recovered = await h.rpc('state')
  check('recovery succeeds after backup becomes writable', recovered.ok)
  const backup = (await fs.readdir(path.dirname(file))).find(name => name.includes('.corrupt-'))
  check('corrupt original is retained in backup', !!backup && await fs.readFile(path.join(path.dirname(file), backup), 'utf8') === raw)

  // Exhaust the Windows rename retries on every CI platform via a temporary override.
  const descriptor = Object.getOwnPropertyDescriptor(process, 'platform')
  const rename = fs.rename
  const originalCopy = fs.copyFile
  let copies = 0
  Object.defineProperty(process, 'platform', { value: 'win32' })
  fs.rename = async () => { throw Object.assign(new Error('locked'), { code: 'EPERM' }) }
  fs.copyFile = async (...args) => { copies++; return originalCopy(...args) }
  const beforeLock = await fs.readFile(file, 'utf8')
  try {
    check('Windows lock is reported', !(await h.rpc('createProject', { name: 'locked' })).ok)
    check('Windows lock never falls back to copy overwrite', copies === 0 && await fs.readFile(file, 'utf8') === beforeLock)
    assert.deepEqual((await h.rpc('state')).value.board, JSON.parse(beforeLock))
    check('Windows lock leaves cache unchanged', true)
  } finally {
    fs.rename = rename
    fs.copyFile = originalCopy
    Object.defineProperty(process, 'platform', descriptor)
  }
  console.log(`\n${checks} RELIABILITY CHECKS PASSED`)
} finally {
  await fs.rm(home, { recursive: true, force: true })
}
