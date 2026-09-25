import { useEffect, useRef } from 'react'
import {
  Niivue,
  SLICE_TYPE,
  MULTIPLANAR_TYPE,
  SHOW_RENDER,
} from '@niivue/niivue'

type BrainViewerProps = {
  onLocationChange?: (coords: [number, number, number]) => void
}

export default function BrainViewer({
  onLocationChange,
}: BrainViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Keep the latest callback without restarting NiiVue.
  const onLocationChangeRef = useRef(onLocationChange)

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const nv = new Niivue({
      show3Dcrosshair: true,
      backColor: [0.06, 0.07, 0.09, 1],
      crosshairColor: [0.75, 0.78, 0.85, 1],
      textHeight: 0.025,
      colorbarHeight: 0,
      isRadiologicalConvention: false,
    })

    let resizeObserver: ResizeObserver | null = null

    async function initializeViewer() {
      if (!canvasRef.current || !containerRef.current) return

      await nv.attachToCanvas(canvasRef.current)

      await nv.loadVolumes([
        {
          url: '/imaging/mni_icbm152_t1_tal_nlin_asym_09c.nii.gz',
          colormap: 'gray',
          opacity: 1,
        },
      ])

      nv.setSliceType(SLICE_TYPE.MULTIPLANAR)
      nv.setMultiplanarLayout(MULTIPLANAR_TYPE.GRID)

      nv.opts.multiplanarShowRender = SHOW_RENDER.ALWAYS
      nv.opts.multiplanarEqualSize = true

      // NiiVue reports MNI coordinates in location.mm.
      nv.onLocationChange = (location: any) => {
        if (!location?.mm || location.mm.length < 3) return

        const coords: [number, number, number] = [
          Number(location.mm[0]),
          Number(location.mm[1]),
          Number(location.mm[2]),
        ]

        onLocationChangeRef.current?.(coords)
      }

      nv.resizeListener()
      nv.drawScene()

      resizeObserver = new ResizeObserver(() => {
        nv.resizeListener()
      })

      resizeObserver.observe(containerRef.current)
    }

    initializeViewer().catch((error) => {
      console.error('Failed to initialize NiiVue:', error)
    })

    return () => {
      resizeObserver?.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} className="brain-viewer">
      <canvas ref={canvasRef} className="brain-canvas" />

      <div className="view-label top-left">Coronal</div>
      <div className="view-label top-right">Sagittal</div>
      <div className="view-label bottom-left">Axial</div>
      <div className="view-label bottom-right">3D</div>
    </div>
  )
}