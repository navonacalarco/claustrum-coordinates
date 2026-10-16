import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadTemplateBytes } from '../src/components/templateCache.ts'

test('template cache: first download, repeat offline read, storage failure and HTTP error', async () => {
  const originalFetch = globalThis.fetch
  const originalCaches = globalThis.caches
  let stored
  let requests = 0
  const signal = new AbortController().signal
  const status = () => {}
  try {
    globalThis.caches = { open: async () => ({
      match: async () => stored ? new Response(stored) : undefined,
      put: async (_url, response) => { stored = await response.arrayBuffer() },
    }) }
    globalThis.fetch = async () => { requests++; return new Response(new Uint8Array([31, 139, 1])) }
    assert.deepEqual(new Uint8Array(await loadTemplateBytes('/brain', signal, status)), new Uint8Array([31, 139, 1]))
    globalThis.fetch = async () => { throw new Error('offline') }
    assert.equal((await loadTemplateBytes('/brain', signal, status)).byteLength, 3)
    assert.equal(requests, 1)
    globalThis.caches = { open: async () => ({
      match: async () => undefined,
      put: async (_url, response) => { await response.arrayBuffer(); throw new Error('quota') },
    }) }
    globalThis.fetch = async () => new Response(new Uint8Array([9]))
    assert.equal((await loadTemplateBytes('/brain', signal, status)).byteLength, 1)
    globalThis.fetch = async () => new Response('', { status: 404 })
    await assert.rejects(loadTemplateBytes('/brain', signal, status), /404/)
    const aborted = new AbortController()
    aborted.abort()
    globalThis.caches = { open: async () => { throw new Error('disabled') } }
    await assert.rejects(loadTemplateBytes('/brain', aborted.signal, status), { name: 'AbortError' })
  } finally {
    globalThis.fetch = originalFetch
    if (originalCaches === undefined) delete globalThis.caches
    else globalThis.caches = originalCaches
  }
})
