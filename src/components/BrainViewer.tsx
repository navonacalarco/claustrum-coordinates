import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Niivue,
  SLICE_TYPE,
  MULTIPLANAR_TYPE,
  SHOW_RENDER,
} from '@niivue/niivue'
import BrainViewerHeader from './BrainViewerHeader'
import RegionBoxOverlay from './RegionBoxOverlay'
import {
  projectRegionBounds,
  projectRegionCuboid3D,
  regionCenter,
  updateBoundsFromDrag,
  type RegionBounds,
  type RegionCuboidProjection,
  type RegionOverlayRect,
} from './regionSelection'
import {
  type BrainViewerProps,
  type Peak,
  type UserLocation,
} from './brainViewerTypes'
import {
  useBasePeakLayer,
  useSelectedPeakLayer,
} from './usePeakLayers'
import {
  useRegionDragMode,
} from './useRegionDragMode'
import {
  useRegionDragPreview,
} from './useRegionDragPreview'
import {
  useViewerControls,
} from './useViewerControls'
import {
  useViewerMode,
} from './useViewerMode'

export default function BrainViewer({
  onViewerReady,
  onLocationChange,
  onPeakClick,
  selectedStudyId = null,
  selectedPeakId = null,
  focusCoordinate = null,
  navigationRequest = null,
  viewMode = 'multi',
  onViewModeChange,
  regionDrawing = false,
  regionBounds = null,
  onRegionBoundsChange,
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

  const onRegionBoundsChangeRef =
    useRef(onRegionBoundsChange)

  const regionDrawingRef =
    useRef(regionDrawing)

  const regionBoundsRef =
    useRef<RegionBounds | null>(
      regionBounds,
    )

  const visiblePeakIdsRef =
    useRef(visiblePeakIds)

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

  useEffect(() => {
    if (!viewerReady) return
    onViewerReady?.(nvRef.current)
    return () => onViewerReady?.(null)
  }, [viewerReady, onViewerReady])

  const [
    regionOverlayRects,
    setRegionOverlayRects,
  ] = useState<
    RegionOverlayRect[]
  >([])

  const [
    regionCuboid3D,
    setRegionCuboid3D,
  ] = useState<
    RegionCuboidProjection | null
  >(null)

  const [
    renderRevision,
    setRenderRevision,
  ] = useState(0)

  useEffect(() => {
    onLocationChangeRef.current =
      onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    onPeakClickRef.current =
      onPeakClick
  }, [onPeakClick])

  useEffect(() => {
    onRegionBoundsChangeRef.current =
      onRegionBoundsChange
  }, [onRegionBoundsChange])

  useEffect(() => {
    regionDrawingRef.current =
      regionDrawing
  }, [regionDrawing])

  useEffect(() => {
    regionBoundsRef.current =
      regionBounds
  }, [regionBounds])

  useEffect(() => {
    visiblePeakIdsRef.current =
      visiblePeakIds
  }, [visiblePeakIds])

  const {
    zoom,
    panMode,
    panModeRef,
    crosshairsVisible,
    zoomIn,
    zoomOut,
    resetZoom,
    togglePan,
    toggleCrosshairs,
  } = useViewerControls({
    nvRef,
    viewerReady,
  })

  const regionDragPreview =
    useRegionDragPreview({
      canvasRef,
      containerRef,
      viewerReady,
      regionDrawing,
    })

  function refreshRegionOverlays(
    nv: Niivue,
    bounds: RegionBounds | null,
  ) {
    const canvas =
      canvasRef.current

    if (!canvas) {
      return
    }

    setRegionOverlayRects(
      projectRegionBounds(
        nv,
        bounds,
        canvas,
      ),
    )

    setRegionCuboid3D(
      projectRegionCuboid3D(
        nv,
        bounds,
        canvas,
      ),
    )
  }

  useEffect(() => {
    if (
      !canvasRef.current ||
      !containerRef.current
    ) {
      return
    }

    let disposed = false
    setViewerReady(false)

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
      meshXRay: 0.25,
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

    let overlayMouseUpHandler:
      | (() => void)
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

      if (disposed) return

      nv.setSliceMM(true)

      await nv.loadVolumes([
        {
          url:
            `${import.meta.env.BASE_URL}imaging/T1w_ICBM152_MNI2009bSym_0p5mm.nii.gz`,
          colormap: 'gray',
          opacity: 1,
        },
      ])

      if (disposed) return

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

      if (disposed) return

      const peaks: Peak[] =
        reviewData.peaks

      peaksRef.current = peaks

      nv.addColormap(
        'LiteraturePeaks',
        {
          R: [255, 255],
          G: [0, 0],
          B: [0, 0],
          A: [255, 255],
          I: [0, 255],
        },
      )

      nv.addColormap(
        'SelectedStudy',
        {
          R: [59, 59],
          G: [154, 154],
          B: [178, 178],
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

      nv.onAzimuthElevationChange =
        () => {
          setRenderRevision(
            (current) =>
              current + 1,
          )
        }

      nv.onZoom3DChange =
        () => {
          setRenderRevision(
            (current) =>
              current + 1,
          )
        }

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

      nv.onDragRelease = (
        params: any,
      ) => {
        if (
          !regionDrawingRef.current ||
          !params?.mmStart ||
          !params?.mmEnd
        ) {
          return
        }

        const orientation =
          params.axCorSag

        if (
          orientation !==
            SLICE_TYPE.AXIAL &&
          orientation !==
            SLICE_TYPE.CORONAL &&
          orientation !==
            SLICE_TYPE.SAGITTAL
        ) {
          return
        }

        const baseVolume =
          nv.volumes[0]

        const minExtent =
          baseVolume
            ?.extentsMinOrtho ??
          nv.extentsMin

        const maxExtent =
          baseVolume
            ?.extentsMaxOrtho ??
          nv.extentsMax

        if (
          !minExtent ||
          !maxExtent
        ) {
          return
        }

        const next =
          updateBoundsFromDrag(
            params,
            regionBoundsRef.current,
            minExtent,
            maxExtent,
          )

        if (!next) {
          return
        }

        regionBoundsRef.current =
          next

        onRegionBoundsChangeRef.current?.(
          next,
        )

        const center =
          regionCenter(next)

        nv.scene.crosshairPos =
          nv.mm2frac(
            center,
          )

        onLocationChangeRef.current?.(
          center,
        )

        // The regionBounds prop update rebuilds
        // the persistent green cuboid in the effect below.
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
        if (
          panModeRef.current ||
          regionDrawingRef.current
        ) {
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

      overlayMouseUpHandler =
        () => {
          window.requestAnimationFrame(
            () => {
              if (
                !canvasRef.current
              ) {
                return
              }

              refreshRegionOverlays(
                nv,
                regionBoundsRef.current,
              )
            },
          )
        }

      canvasRef.current.addEventListener(
        'mouseup',
        overlayMouseUpHandler,
      )

      nv.resizeListener()
      nv.drawScene()

      resizeObserver =
        new ResizeObserver(() => {
          nv.resizeListener()

          window.requestAnimationFrame(
            () => {
              if (
                !canvasRef.current
              ) {
                return
              }

              refreshRegionOverlays(
                nv,
                regionBoundsRef.current,
              )
            },
          )
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
      disposed = true
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

      if (
        canvasRef.current &&
        overlayMouseUpHandler
      ) {
        canvasRef.current.removeEventListener(
          'mouseup',
          overlayMouseUpHandler,
        )
      }

      nvRef.current = null
      baseMeshRef.current = null
      highlightMeshRef.current = null
    }
  }, [])

  useBasePeakLayer({
    nvRef,
    peaksRef,
    baseMeshRef,
    highlightMeshRef,
    viewerReady,
    visiblePeakIds,
  })

  useRegionDragMode({
    nvRef,
    viewerReady,
    regionDrawing,
    panMode,
  })

  useViewerMode({
    nvRef,
    viewerReady,
    viewMode,
  })

  /*
   * Project the same RegionBounds into both the three
   * orthogonal 2D tiles and the passive 3D render overlay.
   */
  useEffect(() => {
    const nv =
      nvRef.current

    if (
      !nv ||
      !canvasRef.current ||
      !viewerReady
    ) {
      setRegionOverlayRects([])
      setRegionCuboid3D(null)
      return
    }

    const frame =
      window.requestAnimationFrame(
        () => {
          refreshRegionOverlays(
            nv,
            regionBounds,
          )
        },
      )

    return () =>
      window.cancelAnimationFrame(
        frame,
      )
  }, [
    regionBounds,
    viewMode,
    zoom,
    renderRevision,
    viewerReady,
  ])

  useSelectedPeakLayer({
    nvRef,
    peaksRef,
    baseMeshRef,
    highlightMeshRef,
    viewerReady,
    visiblePeakIds,
    selectedStudyId,
    selectedPeakId,
    focusCoordinate,
    onLocationChangeRef,
  })

  /*
   * Coordinate navigation is intentionally independent
   * of study selection. Entering a coordinate moves the
   * crosshair/slices but does not clear or alter the
   * currently selected literature study.
   *
   * The requested point is clamped to the loaded template
   * extents. Arbitrary decimal coordinates are otherwise
   * preserved; the 0.5 mm step belongs to the UI control,
   * not to the underlying coordinate model.
   */
  useEffect(() => {
    const nv =
      nvRef.current

    if (
      !nv ||
      !viewerReady ||
      !navigationRequest
    ) {
      return
    }

    const baseVolume =
      nv.volumes[0]

    const minExtent =
      baseVolume
        ?.extentsMinOrtho ??
      nv.extentsMin

    const maxExtent =
      baseVolume
        ?.extentsMaxOrtho ??
      nv.extentsMax

    if (
      !minExtent ||
      !maxExtent
    ) {
      return
    }

    const requested =
      navigationRequest
        .coordinate

    const target:
      [number, number, number] = [
        clamp(
          requested[0],
          Number(
            minExtent[0],
          ),
          Number(
            maxExtent[0],
          ),
        ),
        clamp(
          requested[1],
          Number(
            minExtent[1],
          ),
          Number(
            maxExtent[1],
          ),
        ),
        clamp(
          requested[2],
          Number(
            minExtent[2],
          ),
          Number(
            maxExtent[2],
          ),
        ),
      ]

    nv.scene.crosshairPos =
      nv.mm2frac(target)

    nv.drawScene()

    onLocationChangeRef.current?.(
      target,
    )
  }, [
    navigationRequest,
    viewerReady,
  ])

  function updateRegionFromOverlay(
    nextBounds: RegionBounds,
  ) {
    regionBoundsRef.current =
      nextBounds

    /*
     * Each 2D projection is drawn on the orthogonal slice
     * that passes through the cuboid centre. When a handle
     * changes the cuboid centre, keep NiiVue's three slices
     * centred on that same point. Otherwise the projection
     * can fall off the currently displayed slice and vanish
     * from one or both of the other views.
     */
    const nv =
      nvRef.current

    const canvas =
      canvasRef.current

    if (nv) {
      const center =
        regionCenter(nextBounds)

      nv.scene.crosshairPos =
        nv.mm2frac(center)

      onLocationChangeRef.current?.(
        center,
      )

      nv.drawScene()

      if (canvas) {
        window.requestAnimationFrame(
          () => {
            refreshRegionOverlays(
              nv,
              nextBounds,
            )
          },
        )
      }
    }

    onRegionBoundsChangeRef.current?.(
      nextBounds,
    )
  }

  return (
    <div className="brain-viewer-shell">
      <BrainViewerHeader
        viewMode={viewMode}
        regionDrawing={regionDrawing}
        panMode={panMode}
        crosshairsVisible={
          crosshairsVisible
        }
        onViewModeChange={
          onViewModeChange
        }
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onZoomIn={zoomIn}
        onTogglePan={togglePan}
        onToggleCrosshairs={
          toggleCrosshairs
        }
      />

      <div
        ref={containerRef}
        className={[
          'brain-viewer',
          panMode
            ? 'pan-active'
            : '',
          regionDrawing
            ? 'region-drawing-active'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <RegionBoxOverlay
          drawing={regionDrawing}
          bounds={regionBounds}
          rects={regionOverlayRects}
          cuboid3D={regionCuboid3D}
          liveRect={regionDragPreview}
          onBoundsChange={
            updateRegionFromOverlay
          }
        />

        <canvas
          ref={canvasRef}
          className="brain-canvas"
        />
      </div>
    </div>
  )
}

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  )
}



