export type RegionBounds = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zMin: number
  zMax: number
}

export type RegionPlane =
  | 'coronal'
  | 'sagittal'
  | 'axial'

export type RegionHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'

export type RegionCuboidProjection = {
  points: Array<{
    x: number
    y: number
    depth: number
  }>

  viewport: {
    left: number
    top: number
    width: number
    height: number
  }
}

export type RegionOverlayRect = {
  plane: RegionPlane

  left: number
  top: number
  width: number
  height: number

  horizontalMinPx: number
  horizontalMaxPx: number
  verticalMinPx: number
  verticalMaxPx: number

  tileLeftPx: number
  tileTopPx: number
  tileRightPx: number
  tileBottomPx: number

  horizontalLimitMin: number
  horizontalLimitMax: number
  verticalLimitMin: number
  verticalLimitMax: number
}
