// Bump this version when replacing the template at the same URL.
const CACHE_NAME = 'claustrum-template-display8bit-v1'

export async function loadTemplateBytes(
  url: string,
  signal: AbortSignal,
  onStatus: (message: string) => void,
): Promise<ArrayBuffer> {
  let cache: Cache | undefined
  try {
    cache = await caches.open(CACHE_NAME)
    const saved = await cache.match(url)
    if (saved) {
      signal.throwIfAborted()
      onStatus('Loading saved brain…')
      return await saved.arrayBuffer()
    }
  } catch {
    signal.throwIfAborted()
    cache = undefined // Storage may be unavailable or disabled.
  }

  onStatus('Downloading brain (30 MB)…')
  let response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Brain download failed (${response.status}).`)
  if (cache) {
    try {
      // Consume directly into storage, then read it back. Do not clone/tee
      // the large response into parallel cache and decompression buffers.
      await cache.put(url, response)
      signal.throwIfAborted()
      const saved = await cache.match(url)
      if (saved) return await saved.arrayBuffer()
    } catch {
      signal.throwIfAborted()
      // Quota/storage failures must not prevent viewing the brain.
    }
    response = await fetch(url, { signal })
    if (!response.ok) throw new Error(`Brain download failed (${response.status}).`)
  }
  return await response.arrayBuffer()
}
