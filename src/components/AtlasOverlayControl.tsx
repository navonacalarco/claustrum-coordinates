import { useEffect, useId, useRef, useState } from 'react'
import { NVImage, type Niivue } from '@niivue/niivue'
import { atlasCatalog, atlasStructures, type AtlasDefinition } from './atlasCatalog'
import '../styles/atlas-overlay.css'

type Props = { viewer: Niivue | null }

export default function AtlasOverlayControl({ viewer }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [selected, setSelected] = useState<string[]>([])

  function close() {
    if (detailsRef.current) detailsRef.current.open = false
  }

  function closeAndFocus() {
    close()
    detailsRef.current?.querySelector('summary')?.focus()
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
          closeAndFocus()
        }
      }}>
      <summary className={`atlas-trigger${selected.length ? ' active' : ''}`}>
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <path d="m10 3 7 4-7 4-7-4 7-4ZM3 10l7 4 7-4M3 13l7 4 7-4" />
        </svg>
        Overlays
        {selected.length > 0 && <span className="atlas-count" aria-label={`${selected.length} selected`}>{selected.length}</span>}
        <svg className="atlas-chevron" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m2 8 4-4 4 4" /></svg>
      </summary>
      <div className="atlas-panel" role="group" aria-label="Overlays">
        <div className="atlas-panel-heading">
          <div><strong>Anatomical overlays</strong><p className="atlas-panel-subtitle">Compare segmentations on the brain.</p></div>
          <button type="button" className="atlas-close" aria-label="Close overlays" onClick={closeAndFocus}>×</button>
        </div>
        {!viewer && <p className="atlas-status" role="status">Waiting for brain viewer…</p>}
        {atlasStructures.map((structure) => (
          <section className="atlas-group" key={structure} aria-label={structure}>
            <h3>{structure}</h3>
            {atlasCatalog.filter((atlas) => atlas.structure === structure).map((atlas) => (
              <AtlasRow key={atlas.id} atlas={atlas} viewer={viewer}
                visible={selected.includes(atlas.id)}
                onVisibilityChange={(visible) => setSelected((current) => visible
                  ? [...current.filter((id) => id !== atlas.id), atlas.id]
                  : current.filter((id) => id !== atlas.id))} />
            ))}
          </section>
        ))}
      </div>
    </details>
  )
}

function registerColor(viewer: Niivue, id: string, color: string) {
  const [r, g, b] = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16))
  const colormap = `Atlas-${id}`
  viewer.addColormap(colormap, {
    R: [r, r, r], G: [g, g, g], B: [b, b, b],
    A: [0, 255, 255], I: [0, 1, 255],
  })
  return colormap
}

function AtlasRow({ atlas, viewer, visible, onVisibilityChange }: {
  atlas: AtlasDefinition
  viewer: Niivue | null
  visible: boolean
  onVisibilityChange: (visible: boolean) => void
}) {
  const infoId = useId()
  const [infoOpen, setInfoOpen] = useState(false)
  const [requested, setRequested] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [image, setImage] = useState<NVImage | null>(null)
  const [opacity, setOpacity] = useState(50)
  const [color, setColor] = useState(atlas.color)
  const [error, setError] = useState('')
  const fullName = `${atlas.structure} (${atlas.label})`

  // Load once on first selection; colour and opacity changes never reload the file.
  useEffect(() => {
    if (!viewer || !requested) return
    const nv = viewer
    let cancelled = false
    let addedImage: NVImage | null = null
    setImage(null)
    setError('')

    async function load() {
      const colormap = registerColor(nv, atlas.id, atlas.color)
      const loaded = await NVImage.loadFromUrl({
        url: `${import.meta.env.BASE_URL}imaging/${atlas.filename}`,
        name: `${atlas.structure} (${atlas.label}) segmentation`,
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
      console.error(`Could not load ${atlas.structure} (${atlas.label}):`, cause)
      setError('Could not load overlay.')
    })

    return () => {
      cancelled = true
      if (addedImage && nv.volumes.includes(addedImage)) nv.removeVolume(addedImage)
    }
  }, [viewer, requested, attempt, atlas])

  useEffect(() => {
    if (!viewer || !image || !viewer.volumes.includes(image)) return
    viewer.setColormap(image.id, registerColor(viewer, atlas.id, color))
  }, [viewer, image, color, atlas.id])

  useEffect(() => {
    if (!viewer || !image) return
    const index = viewer.volumes.indexOf(image)
    if (index > 0) viewer.setOpacity(index, visible ? opacity / 100 : 0)
  }, [viewer, image, visible, opacity])

  const ready = !!viewer && !!image && viewer.volumes.includes(image)

  return (
    <div className={`atlas-row${visible ? ' is-selected' : ''}`} style={{ borderLeftColor: color }}>
      <div className="atlas-row-heading">
        <label className="atlas-toggle">
          <input type="checkbox" checked={visible} disabled={!viewer}
            aria-label={`Show ${fullName}`} style={{ accentColor: color }}
            onChange={(event) => {
              if (event.target.checked) setRequested(true)
              onVisibilityChange(event.target.checked)
            }} />
          <span className="atlas-label"><span>{atlas.label}</span><span className="atlas-description">{atlas.description}</span></span>
        </label>
        <input type="color" className="atlas-color" value={color}
          aria-label={`${fullName} colour`} title={`Change ${fullName} colour`}
          onChange={(event) => setColor(event.target.value)} />
      </div>
      <span className="atlas-voxel-badge">{atlas.resolution} isotropic</span>
      <label className="atlas-opacity">
        <span>Opacity</span>
        <input type="range" min="0" max="100" step="1" value={opacity}
          disabled={!viewer || !visible} aria-label={`${fullName} opacity`} aria-valuetext={`${opacity}%`}
          style={{ accentColor: color }}
          onChange={(event) => setOpacity(Number(event.target.value))} />
        <span className="atlas-opacity-value">{opacity}%</span>
      </label>
      {viewer && error ? <div className="atlas-error" role="alert">{error} <button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></div>
        : viewer && requested && !ready ? <p className="atlas-status" role="status">Loading…</p> : null}
      <div className="atlas-row-actions">
        <button type="button" className="atlas-info-button" aria-label={`Sources and details for ${fullName}`}
          aria-expanded={infoOpen} aria-controls={infoId}
          onClick={() => setInfoOpen((open) => !open)}>
          Sources &amp; details <span aria-hidden="true">{infoOpen ? '−' : '+'}</span>
        </button>
        <a className="atlas-download" href={`${import.meta.env.BASE_URL}imaging/${atlas.filename}`}
          download={atlas.filename} aria-label={`Download ${fullName} segmentation (.nii.gz)`}>
          Download <span aria-hidden="true">↓</span>
        </a>
      </div>
      <div id={infoId} className="atlas-provenance" hidden={!infoOpen}>
        <p>{atlas.provenance}</p>
        <span className="atlas-resolution">Overlay voxel size: {atlas.resolution}</span>
        <div className="atlas-source-links">
          {atlas.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} <span aria-hidden="true">↗</span></a>)}
        </div>
      </div>
    </div>
  )
}

