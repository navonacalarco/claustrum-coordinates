import { useEffect, useRef, useState } from 'react'
import { NVImage, type Niivue } from '@niivue/niivue'
import { atlasCatalog, type AtlasDefinition } from './atlasCatalog'
import '../styles/atlas-overlay.css'

type Props = { viewer: Niivue | null }

export default function AtlasOverlayControl({ viewer }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [selected, setSelected] = useState<string[]>([])

  function close() {
    if (detailsRef.current) detailsRef.current.open = false
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !detailsRef.current?.contains(event.target)) close()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  return (
    <details ref={detailsRef} className="atlas-control"
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) close()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          close()
          detailsRef.current?.querySelector('summary')?.focus()
        }
      }}>
      <summary className={`atlas-trigger${selected.length ? ' active' : ''}`}>
        Show atlas
        {selected.length > 0 && <span className="atlas-count" aria-label={`${selected.length} selected`}>{selected.length}</span>}
        <span className="atlas-chevron" aria-hidden="true">⌃</span>
      </summary>
      <div className="atlas-panel" role="group" aria-label="Atlas overlays">
        <div className="atlas-panel-heading">
          <strong>Atlas overlays</strong>
          <button type="button" className="atlas-close" aria-label="Close atlas picker"
            onClick={() => { close(); detailsRef.current?.querySelector('summary')?.focus() }}>×</button>
        </div>
        <p className="atlas-hint">Select one or more to compare.</p>
        {atlasCatalog.map((atlas) => (
          <AtlasRow key={atlas.id} atlas={atlas} viewer={viewer}
            visible={selected.includes(atlas.id)}
            onVisibilityChange={(visible) => setSelected((current) => visible
              ? [...current.filter((id) => id !== atlas.id), atlas.id]
              : current.filter((id) => id !== atlas.id))} />
        ))}
      </div>
    </details>
  )
}

function AtlasRow({ atlas, viewer, visible, onVisibilityChange }: {
  atlas: AtlasDefinition
  viewer: Niivue | null
  visible: boolean
  onVisibilityChange: (visible: boolean) => void
}) {
  const [requested, setRequested] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [image, setImage] = useState<NVImage | null>(null)
  const [opacity, setOpacity] = useState(50)
  const [error, setError] = useState('')

  // Load only on first selection, then retain the image for instant toggling.
  useEffect(() => {
    if (!viewer || !requested) return
    const nv = viewer
    let cancelled = false
    let addedImage: NVImage | null = null
    setImage(null)
    setError('')

    async function load() {
      const [r, g, b] = atlas.rgb
      const colormap = `Atlas-${atlas.id}`
      nv.addColormap(colormap, {
        R: [r, r, r], G: [g, g, g], B: [b, b, b],
        A: [0, 255, 255], I: [0, 1, 255],
      })
      const loaded = await NVImage.loadFromUrl({
        url: `${import.meta.env.BASE_URL}imaging/${atlas.filename}`,
        name: `${atlas.label} claustrum segmentation`,
        colormap, opacity: 0, cal_min: 0, cal_max: 1,
        colorbarVisible: false,
      })
      if (cancelled) return
      nv.addVolume(loaded)
      addedImage = loaded
      setImage(loaded)
    }

    void load().catch((cause: unknown) => {
      if (cancelled) return
      console.error(`Could not load ${atlas.label} atlas:`, cause)
      setError(`Could not load ${atlas.label}. Please retry.`)
    })

    return () => {
      cancelled = true
      if (addedImage && nv.volumes.includes(addedImage)) nv.removeVolume(addedImage)
    }
  }, [viewer, requested, attempt, atlas])

  useEffect(() => {
    if (!viewer || !image) return
    const index = viewer.volumes.indexOf(image)
    if (index > 0) viewer.setOpacity(index, visible ? opacity / 100 : 0)
  }, [viewer, image, visible, opacity])

  const ready = !!viewer && !!image && viewer.volumes.includes(image)

  return (
    <section className="atlas-row">
      <label className="atlas-toggle">
        <input type="checkbox" checked={visible} disabled={!viewer}
          onChange={(event) => {
            if (event.target.checked) setRequested(true)
            onVisibilityChange(event.target.checked)
          }} />
        <span className="atlas-swatch" style={{ backgroundColor: atlas.color }} aria-hidden="true" />
        <strong>{atlas.label}</strong>
      </label>
      <a className="atlas-citation" href={atlas.citationUrl} target="_blank" rel="noreferrer">{atlas.description}</a>
      {!viewer ? <p className="atlas-status" role="status">Waiting for brain viewer…</p>
        : error ? <div className="atlas-error" role="alert">{error} <button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></div>
        : requested && !ready ? <p className="atlas-status" role="status">Loading {atlas.label}…</p> : null}
      <label className="atlas-opacity">
        <span className="atlas-opacity-heading"><span>{atlas.label} opacity</span><span>{opacity}%</span></span>
        <input type="range" min="0" max="100" step="1" value={opacity}
          disabled={!ready || !visible} aria-valuetext={`${opacity}%`}
          style={{ accentColor: atlas.color }}
          onChange={(event) => setOpacity(Number(event.target.value))} />
      </label>
    </section>
  )
}
