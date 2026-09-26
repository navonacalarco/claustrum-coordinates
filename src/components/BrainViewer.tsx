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

  onPeakClick?: (
    peakId: string,
    studyId: string,
    coordinate: [number, number, number],
  ) => void

  selectedStudyId?: string | null

  focusCoordinate?: [
    number,
    number,
    number,
  ] | null

  viewMode?: ViewMode

  onViewModeChange?: (
    viewMode: ViewMode,
  ) => void

  visiblePeakIds?: string[]
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

type UserLocation = {
  coords: [number, number, number]
  time: number
}

export default function BrainViewer({
  onLocationChange,
  onPeakClick,
  selectedStudyId = null,
  focusCoordinate = null,
  viewMode = 'multi',
  onViewModeChange,
  visiblePeakIds,
}: BrainViewerProps) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null)

  const containerRef =
    useRef<HTMLDivElement | null>(null)

  const nvRef =
    useRef<Niivue | null>(null)

  const onLocationChangeRef =
    useRef(onLocationChange)

  const onPeakClickRef =
    useRef(onPeakClick)

  const visiblePeakIdsRef =
    useRef(visiblePeakIds)

  const panModeRef =
    useRef(false)

  const lastUserLocationRef =
    useRef<UserLocation | null>(null)

  const peaksRef =
    useRef<Peak[]>([])

  const baseMeshRef =
    useRef<any>(null)

  const highlightMeshRef =
    useRef<any>(null)

  const [viewerReady, setViewerReady] =
    useState(false)

  const [zoom, setZoom] =
    useState(1)

  const [panMode, setPanMode] =
    useState(false)

  const [
    crosshairsVisible,
    setCrosshairsVisible,
  ] = useState(true)

  useEffect(() => {
    onLocationChangeRef.current =
      onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    onPeakClickRef.current =
      onPeakClick
  }, [onPeakClick])

  useEffect(() => {
    visiblePeakIdsRef.current =
      visiblePeakIds
  }, [visiblePeakIds])

  useEffect(() => {
    panModeRef.current =
      panMode
  }, [panMode])

  useEffect(() => {
    if (
      !canvasRef.current ||
      !containerRef.current
    ) {
      return
    }

    const nv = new Niivue({
      show3Dcrosshair: true,
      crosshairWidth: 1,

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

      textHeight: 0.035,
      colorbarHeight: 0,
      isRadiologicalConvention: false,
      meshXRay: 0.1,
    })

    nvRef.current = nv

    let resizeObserver:
      | ResizeObserver
      | null = null

    let canvasMouseDownHandler:
      | ((event: MouseEvent) => void)
      | null = null

    let canvasClickHandler:
      | ((event: MouseEvent) => void)
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

        // Remember only locations produced by
        // actual viewer interaction. Programmatic
        // study navigation does not write here.
        lastUserLocationRef.current = {
          coords,
          time: performance.now(),
        }

        onLocationChangeRef.current?.(
          coords,
        )
      }

      /*
       * Peak clicking uses the browser's native canvas
       * click event as the trigger. NiiVue still supplies
       * the MNI location through onLocationChange above.
       * This is more reliable than depending on the
       * NiiVue mouse-up callback ordering.
       */
      let mouseDownX = 0
      let mouseDownY = 0

      canvasMouseDownHandler = (
        event: MouseEvent,
      ) => {
        mouseDownX = event.clientX
        mouseDownY = event.clientY
      }

      canvasClickHandler = (
        event: MouseEvent,
      ) => {
        if (panModeRef.current) {
          return
        }

        const dragDistance =
          Math.hypot(
            event.clientX - mouseDownX,
            event.clientY - mouseDownY,
          )

        if (dragDistance > 5) {
          return
        }

        window.requestAnimationFrame(
          () => {
            const lastLocation =
              lastUserLocationRef.current

            if (!lastLocation) {
              return
            }

            // A fresh location change tells us the click
            // occurred in a 2D slice rather than simply
            // reusing an old crosshair location from a
            // click in the 3D render.
            if (
              performance.now() -
                lastLocation.time >
              400
            ) {
              return
            }

            const visibleIds =
              visiblePeakIdsRef.current

            const visibleSet =
              visibleIds
                ? new Set(visibleIds)
                : null

            let nearestPeak:
              | Peak
              | null = null

            let nearestDistance =
              Number.POSITIVE_INFINITY

            for (
              const peak of peaksRef.current
            ) {
              if (
                visibleSet &&
                !visibleSet.has(peak.id)
              ) {
                continue
              }

              const distance =
                Math.hypot(
                  peak.xMni -
                    lastLocation.coords[0],
                  peak.yMni -
                    lastLocation.coords[1],
                  peak.zMni -
                    lastLocation.coords[2],
                )

              if (
                distance < nearestDistance
              ) {
                nearestDistance = distance
                nearestPeak = peak
              }
            }

            if (
              !nearestPeak ||
              nearestDistance > 8
            ) {
              return
            }

            onPeakClickRef.current?.(
              nearestPeak.id,
              nearestPeak.studyId,
              [
                nearestPeak.xMni,
                nearestPeak.yMni,
                nearestPeak.zMni,
              ],
            )
          },
        )
      }

      canvasRef.current.addEventListener(
        'mousedown',
        canvasMouseDownHandler,
      )

      canvasRef.current.addEventListener(
        'click',
        canvasClickHandler,
      )

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

      if (
        canvasRef.current &&
        canvasMouseDownHandler
      ) {
        canvasRef.current.removeEventListener(
          'mousedown',
          canvasMouseDownHandler,
        )
      }

      if (
        canvasRef.current &&
        canvasClickHandler
      ) {
        canvasRef.current.removeEventListener(
          'click',
          canvasClickHandler,
        )
      }

      nvRef.current = null
      baseMeshRef.current = null
      highlightMeshRef.current = null
    }
  }, [])

  /*
   * Rebuild the red point layer whenever
   * the filters change.
   */
  useEffect(() => {
    const nv = nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    if (
      baseMeshRef.current &&
      nv.meshes.includes(
        baseMeshRef.current,
      )
    ) {
      nv.removeMesh(
        baseMeshRef.current,
      )
    }

    baseMeshRef.current = null

    // loadConnectome() replaces the current connectome mesh list.
    // If a blue selection was present, its stored reference is now stale.
    highlightMeshRef.current = null

    const visibleSet =
      visiblePeakIds
        ? new Set(
            visiblePeakIds,
          )
        : null

    const visiblePeaks =
      visibleSet
        ? peaksRef.current.filter(
            (peak) =>
              visibleSet.has(
                peak.id,
              ),
          )
        : peaksRef.current

    if (
      visiblePeaks.length === 0
    ) {
      nv.drawScene()
      return
    }

    nv.loadConnectome({
      name:
        'Reported literature coordinates',

      nodeColormap:
        'red',

      nodeColormapNegative:
        'red',

      nodeMinColor:
        0,

      nodeMaxColor:
        1,

      nodeScale:
        3,

      edgeColormap:
        'red',

      edgeColormapNegative:
        'red',

      edgeMin:
        0,

      edgeMax:
        1,

      edgeScale:
        0,

      showLegend:
        false,

      nodes:
        visiblePeaks.map(
          (peak) => ({
            name:
              `${peak.authors} (${peak.year})`,

            x:
              peak.xMni,

            y:
              peak.yMni,

            z:
              peak.zMni,

            colorValue:
              1,

            sizeValue:
              1,
          }),
        ),

      edges: [],
    })

    baseMeshRef.current =
      nv.meshes[
        nv.meshes.length - 1
      ]

    nv.drawScene()
  }, [
    visiblePeakIds,
    viewerReady,
  ])

  /*
   * Toggle pan interaction.
   */
  useEffect(() => {
    const nv = nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    if (panMode) {
      nv.setDragMode(
        'pan',
      )
    } else {
      nv.setDragMode(
        'contrast',
      )
    }

    nv.drawScene()
  }, [
    panMode,
    viewerReady,
  ])

  /*
   * Switch between 4 views and
   * individual views.
   */
  useEffect(() => {
    const nv = nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    if (
      viewMode === 'multi'
    ) {
      nv.setSliceType(
        SLICE_TYPE.MULTIPLANAR,
      )

      nv.setMultiplanarLayout(
        MULTIPLANAR_TYPE.GRID,
      )

      nv.opts.multiplanarShowRender =
        SHOW_RENDER.ALWAYS

      nv.opts.multiplanarEqualSize =
        true
    }

    if (
      viewMode === 'coronal'
    ) {
      nv.setSliceType(
        SLICE_TYPE.CORONAL,
      )
    }

    if (
      viewMode === 'sagittal'
    ) {
      nv.setSliceType(
        SLICE_TYPE.SAGITTAL,
      )
    }

    if (
      viewMode === 'axial'
    ) {
      nv.setSliceType(
        SLICE_TYPE.AXIAL,
      )
    }

    if (
      viewMode === 'render'
    ) {
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

  /*
   * Highlight selected study and move
   * crosshair to study/peak.
   */
  useEffect(() => {
    const nv = nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    if (
      highlightMeshRef.current &&
      nv.meshes.includes(
        highlightMeshRef.current,
      )
    ) {
      nv.removeMesh(
        highlightMeshRef.current,
      )
    }

    highlightMeshRef.current = null

    if (!selectedStudyId) {
      const visibleSet =
        visiblePeakIds
          ? new Set(
              visiblePeakIds,
            )
          : null

      const visiblePeaks =
        visibleSet
          ? peaksRef.current.filter(
              (peak) =>
                visibleSet.has(
                  peak.id,
                ),
            )
          : peaksRef.current

      if (
        visiblePeaks.length === 0
      ) {
        baseMeshRef.current = null
        nv.drawScene()
        return
      }

      // Selecting a study uses loadConnectome(), which replaces the
      // red connectome. Re-create the red layer when the selection clears.
      nv.loadConnectome({
        name:
          'Reported literature coordinates',

        nodeColormap:
          'red',

        nodeColormapNegative:
          'red',

        nodeMinColor:
          0,

        nodeMaxColor:
          1,

        nodeScale:
          3,

        edgeColormap:
          'red',

        edgeColormapNegative:
          'red',

        edgeMin:
          0,

        edgeMax:
          1,

        edgeScale:
          0,

        showLegend:
          false,

        nodes:
          visiblePeaks.map(
            (peak) => ({
              name:
                `${peak.authors} (${peak.year})`,

              x:
                peak.xMni,

              y:
                peak.yMni,

              z:
                peak.zMni,

              colorValue:
                1,

              sizeValue:
                1,
            }),
          ),

        edges: [],
      })

      baseMeshRef.current =
        nv.meshes[
          nv.meshes.length - 1
        ]

      nv.drawScene()
      return
    }

    const visibleSet =
      visiblePeakIds
        ? new Set(
            visiblePeakIds,
          )
        : null

    const selectedPeaks =
      peaksRef.current.filter(
        (peak) => {
          if (
            peak.studyId !==
            selectedStudyId
          ) {
            return false
          }

          if (
            visibleSet &&
            !visibleSet.has(
              peak.id,
            )
          ) {
            return false
          }

          return true
        },
      )

    if (
      selectedPeaks.length === 0
    ) {
      nv.drawScene()
      return
    }

    nv.loadConnectome({
      name:
        'Selected study',

      nodeColormap:
        'SelectedStudy',

      nodeColormapNegative:
        'SelectedStudy',

      nodeMinColor:
        0,

      nodeMaxColor:
        1,

      nodeScale:
        5,

      edgeColormap:
        'SelectedStudy',

      edgeColormapNegative:
        'SelectedStudy',

      edgeMin:
        0,

      edgeMax:
        1,

      edgeScale:
        0,

      showLegend:
        false,

      nodes:
        selectedPeaks.map(
          (peak) => ({
            name:
              `${peak.authors} (${peak.year})`,

            x:
              peak.xMni,

            y:
              peak.yMni,

            z:
              peak.zMni,

            colorValue:
              1,

            sizeValue:
              1,
          }),
        ),

      edges: [],
    })

    // loadConnectome() replaced the red connectome, so its ref is stale.
    baseMeshRef.current = null

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
          (
            sum,
            peak,
          ) => {
            return [
              sum[0] +
                peak.xMni,

              sum[1] +
                peak.yMni,

              sum[2] +
                peak.zMni,
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
      nv.mm2frac(
        target,
      )

    nv.scene.crosshairPos =
      fractionalPosition

    onLocationChangeRef.current?.(
      target,
    )

    nv.drawScene()
  }, [
    selectedStudyId,
    focusCoordinate,
    visiblePeakIds,
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

    setZoom(
      safeZoom,
    )

    const currentPan =
      nv.scene.pan2Dxyzmm ??
      [
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

    nv.setScale(
      safeZoom,
    )

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
    const nv = nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    setZoom(1)

    nv.setPan2Dxyzmm([
      0,
      0,
      0,
      1,
    ])

    nv.setScale(1)

    nv.drawScene()
  }

  function toggleCrosshairs() {
    const nv = nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    const nextVisible =
      !crosshairsVisible

    setCrosshairsVisible(
      nextVisible,
    )

    nv.setCrosshairWidth(
      nextVisible
        ? 1
        : 0,
    )

    nv.opts.show3Dcrosshair =
      nextVisible

    nv.drawScene()
  }

  return (
    <div className="brain-viewer-shell">
      <div className="brain-viewer-header">
        <div className="view-mode-bar brain-header-views">
          <button
            type="button"
            className={
              viewMode === 'multi'
                ? 'active'
                : ''
            }
            onClick={() =>
              onViewModeChange?.('multi')
            }
          >
            4 views
          </button>

          <button
            type="button"
            className={
              viewMode === 'coronal'
                ? 'active'
                : ''
            }
            onClick={() =>
              onViewModeChange?.('coronal')
            }
          >
            Coronal
          </button>

          <button
            type="button"
            className={
              viewMode === 'sagittal'
                ? 'active'
                : ''
            }
            onClick={() =>
              onViewModeChange?.('sagittal')
            }
          >
            Sagittal
          </button>

          <button
            type="button"
            className={
              viewMode === 'axial'
                ? 'active'
                : ''
            }
            onClick={() =>
              onViewModeChange?.('axial')
            }
          >
            Axial
          </button>

          <button
            type="button"
            className={
              viewMode === 'render'
                ? 'active'
                : ''
            }
            onClick={() =>
              onViewModeChange?.('render')
            }
          >
            3D
          </button>
        </div>

        <div className="zoom-controls brain-header-tools">
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
            title="Reset pan and zoom"
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

          <span className="viewer-control-divider" />

          <button
            type="button"
            className={
              panMode
                ? 'pan-button active'
                : 'pan-button'
            }
            onClick={() =>
              setPanMode(
                (current) =>
                  !current,
              )
            }
            title={
              panMode
                ? 'Turn pan mode off'
                : 'Turn pan mode on'
            }
          >
            Pan
          </button>

          <span className="viewer-control-divider" />

          <button
            type="button"
            className={
              crosshairsVisible
                ? 'crosshair-button active'
                : 'crosshair-button'
            }
            onClick={toggleCrosshairs}
            title={
              crosshairsVisible
                ? 'Hide crosshairs'
                : 'Show crosshairs'
            }
            aria-pressed={
              crosshairsVisible
            }
          >
            Crosshairs
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={
          panMode
            ? 'brain-viewer pan-active'
            : 'brain-viewer'
        }
      >
        <canvas
          ref={canvasRef}
          className="brain-canvas"
        />
      </div>
    </div>
  )
}
