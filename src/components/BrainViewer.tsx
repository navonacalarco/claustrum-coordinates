import { useEffect, useRef, useState } from 'react'
import {
  Niivue,
  SLICE_TYPE,
  MULTIPLANAR_TYPE,
  SHOW_RENDER,
} from '@niivue/niivue'

type ViewMode =
  | 'multi'
  | 'coronal'
  | 'sagittal'
  | 'axial'
  | 'render'

type BrainViewerProps = {
  onLocationChange?: (
    coords: [number, number, number],
  ) => void
  selectedStudyId?: string | null
  focusCoordinate?: [
    number,
    number,
    number,
  ] | null
  viewMode?: ViewMode
}

type Peak = {
  id: string
  studyId: string
  authors: string
  year: number | null
  xMni: number
  yMni: number
  zMni: number
}

export default function BrainViewer({
  onLocationChange,
  selectedStudyId = null,
  focusCoordinate = null,
  viewMode = 'multi',
}: BrainViewerProps) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null)

  const containerRef =
    useRef<HTMLDivElement | null>(null)

  const nvRef =
    useRef<Niivue | null>(null)

  const onLocationChangeRef =
    useRef(onLocationChange)

  const peaksRef =
    useRef<Peak[]>([])

  const highlightMeshRef =
    useRef<any>(null)

  const [viewerReady, setViewerReady] =
    useState(false)

  const [zoom, setZoom] =
    useState(1)

  useEffect(() => {
    onLocationChangeRef.current =
      onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    if (
      !canvasRef.current ||
      !containerRef.current
    ) {
      return
    }

    const nv = new Niivue({
      show3Dcrosshair: true,

      backColor: [
        0.06,
        0.07,
        0.09,
        1,
      ],

      crosshairColor: [
        0.75,
        0.78,
        0.85,
        1,
      ],

      textHeight: 0.025,
      colorbarHeight: 0,
      isRadiologicalConvention: false,
      meshXRay: 0.1,
    })

    nvRef.current = nv

    let resizeObserver:
      | ResizeObserver
      | null = null

    async function initializeViewer() {
      if (
        !canvasRef.current ||
        !containerRef.current
      ) {
        return
      }

      await nv.attachToCanvas(
        canvasRef.current,
      )

      nv.setSliceMM(true)

      await nv.loadVolumes([
        {
          url:
            '/imaging/mni_icbm152_t1_tal_nlin_asym_09c.nii.gz',
          colormap: 'gray',
          opacity: 1,
        },
      ])

      const peakResponse =
        await fetch(
          '/data/peaks-mni.json',
        )

      if (!peakResponse.ok) {
        throw new Error(
          'Could not load literature peak coordinates',
        )
      }

      const reviewData =
        await peakResponse.json()

      const peaks: Peak[] =
        reviewData.peaks

      peaksRef.current = peaks

      nv.addColormap(
        'SelectedStudy',
        {
          R: [79, 79],
          G: [95, 95],
          B: [245, 245],
          A: [255, 255],
          I: [0, 255],
        },
      )

      nv.loadConnectome({
        name:
          'Reported literature coordinates',

        nodeColormap: 'red',
        nodeColormapNegative: 'red',
        nodeMinColor: 0,
        nodeMaxColor: 1,
        nodeScale: 3,

        edgeColormap: 'red',
        edgeColormapNegative: 'red',
        edgeMin: 0,
        edgeMax: 1,
        edgeScale: 0,

        showLegend: false,

        nodes: peaks.map(
          (peak) => ({
            name:
              `${peak.authors} (${peak.year})`,
            x: peak.xMni,
            y: peak.yMni,
            z: peak.zMni,
            colorValue: 1,
            sizeValue: 1,
          }),
        ),

        edges: [],
      })

      nv.setMeshThicknessOn2D(4)

      nv.setSliceType(
        SLICE_TYPE.MULTIPLANAR,
      )

      nv.setMultiplanarLayout(
        MULTIPLANAR_TYPE.GRID,
      )

      nv.opts.multiplanarShowRender =
        SHOW_RENDER.ALWAYS

      nv.opts.multiplanarEqualSize = true

      nv.onLocationChange = (
        location: any,
      ) => {
        if (
          !location?.mm ||
          location.mm.length < 3
        ) {
          return
        }

        const coords:
          [number, number, number] = [
            Number(location.mm[0]),
            Number(location.mm[1]),
            Number(location.mm[2]),
          ]

        onLocationChangeRef.current?.(
          coords,
        )
      }

      nv.resizeListener()
      nv.drawScene()

      resizeObserver =
        new ResizeObserver(() => {
          nv.resizeListener()
        })

      resizeObserver.observe(
        containerRef.current,
      )

      setViewerReady(true)
    }

    initializeViewer().catch(
      (error) => {
        console.error(
          'Failed to initialize NiiVue:',
          error,
        )
      },
    )

    return () => {
      resizeObserver?.disconnect()

      nvRef.current = null
      highlightMeshRef.current = null
    }
  }, [])

  // Switch between 4-view and single-view modes.
  useEffect(() => {
    const nv = nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    if (viewMode === 'multi') {
      nv.setSliceType(
        SLICE_TYPE.MULTIPLANAR,
      )

      nv.setMultiplanarLayout(
        MULTIPLANAR_TYPE.GRID,
      )

      nv.opts.multiplanarShowRender =
        SHOW_RENDER.ALWAYS

      nv.opts.multiplanarEqualSize = true
    }

    if (viewMode === 'coronal') {
      nv.setSliceType(
        SLICE_TYPE.CORONAL,
      )
    }

    if (viewMode === 'sagittal') {
      nv.setSliceType(
        SLICE_TYPE.SAGITTAL,
      )
    }

    if (viewMode === 'axial') {
      nv.setSliceType(
        SLICE_TYPE.AXIAL,
      )
    }

    if (viewMode === 'render') {
      nv.setSliceType(
        SLICE_TYPE.RENDER,
      )
    }

    nv.resizeListener()
    nv.drawScene()
  }, [
    viewMode,
    viewerReady,
  ])

  // Selected-study highlighting and navigation.
  useEffect(() => {
    const nv = nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    if (highlightMeshRef.current) {
      nv.removeMesh(
        highlightMeshRef.current,
      )

      highlightMeshRef.current = null
    }

    if (!selectedStudyId) {
      nv.drawScene()
      return
    }

    const selectedPeaks =
      peaksRef.current.filter(
        (peak) =>
          peak.studyId ===
          selectedStudyId,
      )

    if (selectedPeaks.length === 0) {
      nv.drawScene()
      return
    }

    nv.loadConnectome({
      name: 'Selected study',

      nodeColormap:
        'SelectedStudy',

      nodeColormapNegative:
        'SelectedStudy',

      nodeMinColor: 0,
      nodeMaxColor: 1,
      nodeScale: 5,

      edgeColormap:
        'SelectedStudy',

      edgeColormapNegative:
        'SelectedStudy',

      edgeMin: 0,
      edgeMax: 1,
      edgeScale: 0,

      showLegend: false,

      nodes: selectedPeaks.map(
        (peak) => ({
          name:
            `${peak.authors} (${peak.year})`,
          x: peak.xMni,
          y: peak.yMni,
          z: peak.zMni,
          colorValue: 1,
          sizeValue: 1,
        }),
      ),

      edges: [],
    })

    highlightMeshRef.current =
      nv.meshes[
        nv.meshes.length - 1
      ]

    let target:
      [number, number, number]

    if (focusCoordinate) {
      target =
        focusCoordinate
    } else {
      const total =
        selectedPeaks.reduce(
          (sum, peak) => {
            return [
              sum[0] + peak.xMni,
              sum[1] + peak.yMni,
              sum[2] + peak.zMni,
            ] as [
              number,
              number,
              number,
            ]
          },
          [0, 0, 0] as [
            number,
            number,
            number,
          ],
        )

      target = [
        total[0] /
          selectedPeaks.length,

        total[1] /
          selectedPeaks.length,

        total[2] /
          selectedPeaks.length,
      ]
    }

    const fractionalPosition =
      nv.mm2frac(target)

    nv.scene.crosshairPos =
      fractionalPosition

    onLocationChangeRef.current?.(
      target,
    )

    nv.drawScene()
  }, [
    selectedStudyId,
    focusCoordinate,
    viewerReady,
  ])

  function applyZoom(
    nextZoom: number,
  ) {
    const nv = nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    const safeZoom =
      Math.min(
        4,
        Math.max(
          0.5,
          nextZoom,
        ),
      )

    setZoom(safeZoom)

    // Preserve any existing 2D pan while
    // changing only its zoom component.
    const currentPan =
      nv.scene.pan2Dxyzmm ?? [
        0,
        0,
        0,
        1,
      ]

    nv.setPan2Dxyzmm([
      currentPan[0],
      currentPan[1],
      currentPan[2],
      safeZoom,
    ])

    // 3D rendering uses its own scale.
    nv.setScale(safeZoom)

    nv.drawScene()
  }

  function zoomIn() {
    applyZoom(
      zoom * 1.25,
    )
  }

  function zoomOut() {
    applyZoom(
      zoom / 1.25,
    )
  }

  function resetZoom() {
    applyZoom(1)
  }

  return (
    <div
      ref={containerRef}
      className="brain-viewer"
    >
      <canvas
        ref={canvasRef}
        className="brain-canvas"
      />

      <div className="zoom-controls">
        <button
          type="button"
          onClick={zoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>

        <button
          type="button"
          className="zoom-reset"
          onClick={resetZoom}
          title="Reset zoom"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={zoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>

      {viewMode === 'multi' && (
        <>
          <div className="view-label top-left">
            Coronal
          </div>

          <div className="view-label top-right">
            Sagittal
          </div>

          <div className="view-label bottom-left">
            Axial
          </div>

          <div className="view-label bottom-right">
            3D
          </div>
        </>
      )}
    </div>
  )
}