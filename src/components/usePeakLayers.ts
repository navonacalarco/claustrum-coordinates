import {
  useEffect,
} from 'react'
import type {
  Niivue,
} from '@niivue/niivue'
import type {
  Peak,
} from './brainViewerTypes'

type MutableRef<T> = {
  current: T
}

type SharedPeakLayerArgs = {
  nvRef: MutableRef<Niivue | null>
  peaksRef: MutableRef<Peak[]>
  baseMeshRef: MutableRef<any>
  highlightMeshRef: MutableRef<any>
  viewerReady: boolean
  visiblePeakIds?: string[]
}

export function useBasePeakLayer({
  nvRef,
  peaksRef,
  baseMeshRef,
  highlightMeshRef,
  viewerReady,
  visiblePeakIds,
}: SharedPeakLayerArgs) {
  useEffect(() => {
    const nv =
      nvRef.current

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
    highlightMeshRef.current = null

    const visiblePeaks =
      getVisiblePeaks(
        peaksRef.current,
        visiblePeakIds,
      )

    if (
      visiblePeaks.length === 0
    ) {
      nv.drawScene()
      return
    }

    baseMeshRef.current =
      loadPeakLayer(
        nv,
        visiblePeaks,
        'base',
      )

    nv.drawScene()
  }, [
    nvRef,
    peaksRef,
    baseMeshRef,
    highlightMeshRef,
    visiblePeakIds,
    viewerReady,
  ])
}

type SelectedPeakLayerArgs =
  SharedPeakLayerArgs & {
    selectedStudyId:
      string | null

    focusCoordinate:
      [number, number, number] | null

    onLocationChangeRef:
      MutableRef<
        | ((
            coords: [
              number,
              number,
              number,
            ],
          ) => void)
        | undefined
      >
  }

export function useSelectedPeakLayer({
  nvRef,
  peaksRef,
  baseMeshRef,
  highlightMeshRef,
  viewerReady,
  visiblePeakIds,
  selectedStudyId,
  focusCoordinate,
  onLocationChangeRef,
}: SelectedPeakLayerArgs) {
  useEffect(() => {
    const nv =
      nvRef.current

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

    highlightMeshRef.current =
      null

    const visiblePeaks =
      getVisiblePeaks(
        peaksRef.current,
        visiblePeakIds,
      )

    if (!selectedStudyId) {
      if (
        visiblePeaks.length === 0
      ) {
        baseMeshRef.current =
          null
        nv.drawScene()
        return
      }

      baseMeshRef.current =
        loadPeakLayer(
          nv,
          visiblePeaks,
          'base',
        )

      nv.drawScene()
      return
    }

    const selectedPeaks =
      visiblePeaks.filter(
        (peak) =>
          peak.studyId ===
          selectedStudyId,
      )

    if (
      selectedPeaks.length === 0
    ) {
      nv.drawScene()
      return
    }

    loadPeakLayer(
      nv,
      selectedPeaks,
      'selected',
    )

    baseMeshRef.current = null

    highlightMeshRef.current =
      nv.meshes[
        nv.meshes.length - 1
      ]

    const target =
      focusCoordinate ??
      centroid(selectedPeaks)

    nv.scene.crosshairPos =
      nv.mm2frac(target)

    onLocationChangeRef.current?.(
      target,
    )

    nv.drawScene()
  }, [
    nvRef,
    peaksRef,
    baseMeshRef,
    highlightMeshRef,
    selectedStudyId,
    focusCoordinate,
    visiblePeakIds,
    viewerReady,
    onLocationChangeRef,
  ])
}

function getVisiblePeaks(
  peaks: Peak[],
  visiblePeakIds?: string[],
) {
  if (!visiblePeakIds) {
    return peaks
  }

  const visibleSet =
    new Set(visiblePeakIds)

  return peaks.filter(
    (peak) =>
      visibleSet.has(
        peak.id,
      ),
  )
}

function loadPeakLayer(
  nv: Niivue,
  peaks: Peak[],
  layer:
    | 'base'
    | 'selected',
) {
  const selected =
    layer === 'selected'

  const colormap =
    selected
      ? 'SelectedStudy'
      : 'LiteraturePeaks'

  nv.loadConnectome({
    name:
      selected
        ? 'Selected study'
        : 'Reported literature coordinates',

    nodeColormap:
      colormap,

    nodeColormapNegative:
      colormap,

    nodeMinColor: 0,
    nodeMaxColor: 1,

    nodeScale:
      selected
        ? 5
        : 4,

    edgeColormap:
      colormap,

    edgeColormapNegative:
      colormap,

    edgeMin: 0,
    edgeMax: 1,
    edgeScale: 0,

    showLegend:
      false,

    nodes:
      peaks.map(
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

  return (
    nv.meshes[
      nv.meshes.length - 1
    ] ??
    null
  )
}

function centroid(
  peaks: Peak[],
): [number, number, number] {
  const total =
    peaks.reduce<[number, number, number]>(
      (
        sum,
        peak,
      ) => [
        sum[0] +
          peak.xMni,
        sum[1] +
          peak.yMni,
        sum[2] +
          peak.zMni,
      ],
      [
        0,
        0,
        0,
      ] as [
        number,
        number,
        number,
      ],
    )

  return [
    total[0] /
      peaks.length,
    total[1] /
      peaks.length,
    total[2] /
      peaks.length,
  ]
}
