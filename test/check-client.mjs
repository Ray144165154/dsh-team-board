/**
 * Static contract checks for the Client half. No browser, no React: it reads
 * client.js as text and asserts the things a broken edit would silently break.
 *
 *   node test/check-client.mjs
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const file = path.join(here, '..', 'client.js')
const source = await readFile(file, 'utf8')

const RPC_METHODS = new Set([
  'state',
  'answerDecision',
  'setTaskStatus',
  'toggleCheck',
  'createProject',
  'upsertTask',
])

let failures = 0
function check(label, condition, detail) {
  if (condition) {
    console.log(`  ok   ${label}`)
  } else {
    failures += 1
    console.log(`  FAIL ${label}${detail === undefined ? '' : ` :: ${detail}`}`)
  }
}

/** Extract one `const name = { ... }` object literal and evaluate it. */
function objectLiteral(startMarker) {
  const start = source.indexOf(startMarker)
  if (start === -1) throw new Error(`missing ${startMarker}`)
  const open = source.indexOf('{', start)
  let depth = 0
  let quote = null
  let escaped = false
  for (let cursor = open; cursor < source.length; cursor += 1) {
    const character = source[cursor]
    if (quote !== null) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = null
      continue
    }
    if (character === "'" || character === '"' || character === '`') { quote = character; continue }
    if (character === '{') depth += 1
    else if (character === '}') {
      depth -= 1
      if (depth === 0) {
        const body = source.slice(open, cursor + 1)
        return new Function(`return (${body})`)()
      }
    }
  }
  throw new Error(`unterminated object literal after ${startMarker}`)
}

const zh = objectLiteral('const zh = {')
const en = objectLiteral('const en = {')
const zhKeys = new Set(Object.keys(zh))
const enKeys = new Set(Object.keys(en))

const used = new Set()
for (const match of source.matchAll(/\b(?:t|translate)\(\s*'([^']+)'/g)) used.add(match[1])

const missingZh = [...used].filter((key) => !zhKeys.has(key)).sort()
const missingEn = [...used].filter((key) => !enKeys.has(key)).sort()
const zhOnly = [...zhKeys].filter((key) => !enKeys.has(key)).sort()
const enOnly = [...enKeys].filter((key) => !zhKeys.has(key)).sort()

check('locale: every used key exists in zh', missingZh.length === 0, missingZh)
check('locale: every used key exists in en', missingEn.length === 0, missingEn)
check('locale: zh/en dictionaries have the same keys', zhOnly.length === 0 && enOnly.length === 0, { zhOnly, enOnly })

const called = [...new Set([...source.matchAll(/\bcall\(\s*'([A-Za-z]+)'/g)].map((match) => match[1]))].sort()
const unknown = called.filter((method) => !RPC_METHODS.has(method))
check(`rpc: only contract methods are called (${called.join(', ')})`, unknown.length === 0, unknown)

check('slots: sidebar entry registered', /name:\s*'sidebar\.panellist'/.test(source))
check('slots: main page registered', /name:\s*'main'/.test(source))
check('slots: shared panel id', /const PANEL_ID = 'dsh-team-board'/.test(source)
  && /id:\s*PANEL_ID/.test(source) && /key:\s*PANEL_ID/.test(source))

check('no Harness Client package import', !/@deepseek-ai\/dsh-client/.test(source))
check('no document.body write', !/document\.body/.test(source))
check('apply: locale, styles and slots are owned by ctx.effect',
  (source.match(/ctx\.effect\(/g) ?? []).length >= 3
  && !/^\s*document\.createElement/m.test(source))

const css = /String\.raw`([\s\S]*?)`/.exec(source)?.[1] ?? ''
const rawColors = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((match) => match[0])
const nonWhiteColors = rawColors.filter((value) => !/^#(?:fff|ffffff)$/i.test(value))
check('styles: only theme tokens and white text (color literals)', nonWhiteColors.length === 0, nonWhiteColors)
const varRefs = [...new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((match) => match[1]))]
const offTheme = varRefs.filter((name) => !name.startsWith('--dsw-'))
check(`styles: every custom property is a DSH token (${varRefs.length} used)`, offTheme.length === 0, offTheme)

check('styles: element is cleaned up', /element\.remove\(\)/.test(source))
check('cleanup: polling interval is cleared', /clearInterval/.test(source))

console.log(failures === 0 ? '\nCLIENT CONTRACT OK' : `\n${failures} CLIENT CHECK(S) FAILED`)
process.exitCode = failures === 0 ? 0 : 1
