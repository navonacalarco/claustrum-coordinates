import type {
  RegionBounds,
} from './regionSelection'

export type ViewMode =
  | 'multi'
  | 'coronal'
  | 'sagittal'
  | 'axial'
  | 'render'

export type Peak = {
  id: string
  studyId: string
  authors: string
  year: number | null
  xMni: number
  yMni: number
  zMni: number
}

export type UserLocation = {
  coords: [number, number, number]
  time: number
}

export type CoordinateNavigationRequest = {
  coordinate: [
    number,
    number,
    number,
  ]
  requestId: number
}

export type BrainViewerProps = {
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

  navigationRequest?:
    CoordinateNavigationRequest | null

  viewMode?: ViewMode

  onViewModeChange?: (
    viewMode: ViewMode,
  ) => void

  regionDrawing?: boolean
  regionBounds?: RegionBounds | null

  onRegionBoundsChange?: (
    bounds: RegionBounds,
  ) => void

  visiblePeakIds?: string[]
}
