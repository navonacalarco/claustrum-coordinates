import { useEffect, useRef, useState } from 'react'
import { NVImage, type Niivue } from '@niivue/niivue'
import '../styles/bigbrain-overlay.css'

type Props = { viewer: Niivue | null }

export default function BigBrainOverlayControl({ viewer }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [overlay, setOverlay] = useState<NVImage | null>(null)
  const [visible, setVisible] = useState(false)
  const [opacity, setOpacity] = useState(50)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!viewer) return
    const nv = viewer
    let cancelled = false
    let addedImage: NVImage | null = null
    setOverlay(null)
    setError('')

    async function loadOverlay() {
      nv.addColormap('BigBrainTurquoise', {
        R: [45, 45, 45], G: [212, 212, 212], B: [191, 191, 191],
        A: [0, 255, 255], I: [0, 1, 255],
      })
      const image = await NVImage.loadFromUrl({
        url: `${import.meta.env.BASE_URL}imaging/claustrum_BigBrainCalarco_ICBM2009symXiao_0p5mm.nii.gz`,
        name: 'BigBrain claustrum segmentation',
        colormap: 'BigBrainTurquoise',
        opacity: 0,
        cal_min: 0,
        cal_max: 1,
        colorbarVisible: false,
      })
      if (cancelled) return
      nv.addVolume(image)
      addedImage = image
      setOverlay(image)
    }

    void loadOverlay().catch((cause: unknown) => {
      if (cancelled) return
      console.error('Could not load BigBrain overlay:', cause)
      setError('Could not load the overlay. Check the segmentation file in public/imaging, then refresh.')
    })

    return () => {
      cancelled = true
      if (addedImage && nv.volumes.includes(addedImage)) {
        nv.removeVolume(addedImage)
      }
    }
  }, [viewer])

  useEffect(() => {
    if (!viewer || !overlay) return
    const index = viewer.volumes.indexOf(overlay)
    if (index < 1) return
    viewer.setOpacity(index, visible ? opacity / 100 : 0)
  }, [viewer, overlay, visible, opacity])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const details = detailsRef.current
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const ready = viewer !== null && overlay !== null

  return (
    <details
      ref={detailsRef}
      className="bigbrain-control"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && detailsRef.current) {
          detailsRef.current.open = false
          detailsRef.current.querySelector('summary')?.focus()
        }
      }}
    >
      <summary className={visible && ready ? 'bigbrain-trigger active' : 'bigbrain-trigger'}>
        <span className="bigbrain-dot" aria-hidden="true" />
        BigBrain overlay
      </summary>
      <div className="bigbrain-panel">
        <strong>BigBrain claustrum segmentation</strong>
        <a className="bigbrain-citation" href="https://doi.org/10.1073/pnas.2604111123" target="_blank" rel="noreferrer">
          Calarco et al., PNAS, 2026
        </a>
        {error ? (
          <p className="bigbrain-error" role="alert">{error}</p>
        ) : !ready ? (
          <p className="bigbrain-status" role="status">
            {viewer ? 'Loading overlay…' : 'Waiting for brain viewer…'}
          </p>
        ) : null}
        <label className="bigbrain-toggle">
          <input type="checkbox" checked={visible} disabled={!ready}
            onChange={(event) => setVisible(event.target.checked)} />
          Show overlay
        </label>
        <label className="bigbrain-opacity">
          <span className="bigbrain-opacity-heading"><span>Opacity</span><span>{opacity}%</span></span>
          <input type="range" min="0" max="100" step="1" value={opacity}
            disabled={!ready || !visible} aria-valuetext={`${opacity}%`}
            onChange={(event) => setOpacity(Number(event.target.value))} />
        </label>
      </div>
    </details>
  )
}
