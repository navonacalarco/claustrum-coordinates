import {
  SLICE_TYPE,
} from '@niivue/niivue'
import type {
  RegionBounds,
  RegionHandle,
  RegionOverlayRect,
  RegionPlane,
} from './regionTypes'

type DragReleaseLike = {
  mmStart?: ArrayLike<number>
  mmEnd?: ArrayLike<number>
  axCorSag?: number
}

export function updateBoundsFromDrag(
  params: DragReleaseLike,
  current: RegionBounds | null,
  minExtent: ArrayLike<number>,
  maxExtent: ArrayLike<number>,
): RegionBounds | null {
  if (
    !params.mmStart ||
    !params.mmEnd
  ) {
    return null
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
    return null
  }

  const start =
    params.mmStart

  const end =
    params.mmEnd

  /*
   * The first drag defines two visible axes.
   * The hidden axis initially gets a 20 mm
   * depth centred on the current slice.
   */
  const next: RegionBounds =
    current
      ? { ...current }
      : {
          xMin: clamp(
            Number(start[0]) - 10,
            Number(minExtent[0]),
            Number(maxExtent[0]),
          ),
          xMax: clamp(
            Number(start[0]) + 10,
            Number(minExtent[0]),
            Number(maxExtent[0]),
          ),
          yMin: clamp(
            Number(start[1]) - 10,
            Number(minExtent[1]),
            Number(maxExtent[1]),
          ),
          yMax: clamp(
            Number(start[1]) + 10,
            Number(minExtent[1]),
            Number(maxExtent[1]),
          ),
          zMin: clamp(
            Number(start[2]) - 10,
            Number(minExtent[2]),
            Number(maxExtent[2]),
          ),
          zMax: clamp(
            Number(start[2]) + 10,
            Number(minExtent[2]),
            Number(maxExtent[2]),
          ),
        }

  if (
    orientation ===
    SLICE_TYPE.AXIAL
  ) {
    const [xMin, xMax] =
      normalizeBounds(
        Number(start[0]),
        Number(end[0]),
      )

    const [yMin, yMax] =
      normalizeBounds(
        Number(start[1]),
        Number(end[1]),
      )

    next.xMin =
      roundMni(
        clamp(
          xMin,
          Number(minExtent[0]),
          Number(maxExtent[0]),
        ),
      )

    next.xMax =
      roundMni(
        clamp(
          xMax,
          Number(minExtent[0]),
          Number(maxExtent[0]),
        ),
      )

    next.yMin =
      roundMni(
        clamp(
          yMin,
          Number(minExtent[1]),
          Number(maxExtent[1]),
        ),
      )

    next.yMax =
      roundMni(
        clamp(
          yMax,
          Number(minExtent[1]),
          Number(maxExtent[1]),
        ),
      )
  }

  if (
    orientation ===
    SLICE_TYPE.CORONAL
  ) {
    const [xMin, xMax] =
      normalizeBounds(
        Number(start[0]),
        Number(end[0]),
      )

    const [zMin, zMax] =
      normalizeBounds(
        Number(start[2]),
        Number(end[2]),
      )

    next.xMin =
      roundMni(
        clamp(
          xMin,
          Number(minExtent[0]),
          Number(maxExtent[0]),
        ),
      )

    next.xMax =
      roundMni(
        clamp(
          xMax,
          Number(minExtent[0]),
          Number(maxExtent[0]),
        ),
      )

    next.zMin =
      roundMni(
        clamp(
          zMin,
          Number(minExtent[2]),
          Number(maxExtent[2]),
        ),
      )

    next.zMax =
      roundMni(
        clamp(
          zMax,
          Number(minExtent[2]),
          Number(maxExtent[2]),
        ),
      )
  }

  if (
    orientation ===
    SLICE_TYPE.SAGITTAL
  ) {
    const [yMin, yMax] =
      normalizeBounds(
        Number(start[1]),
        Number(end[1]),
      )

    const [zMin, zMax] =
      normalizeBounds(
        Number(start[2]),
        Number(end[2]),
      )

    next.yMin =
      roundMni(
        clamp(
          yMin,
          Number(minExtent[1]),
          Number(maxExtent[1]),
        ),
      )

    next.yMax =
      roundMni(
        clamp(
          yMax,
          Number(minExtent[1]),
          Number(maxExtent[1]),
        ),
      )

    next.zMin =
      roundMni(
        clamp(
          zMin,
          Number(minExtent[2]),
          Number(maxExtent[2]),
        ),
      )

    next.zMax =
      roundMni(
        clamp(
          zMax,
          Number(minExtent[2]),
          Number(maxExtent[2]),
        ),
      )
  }

  return next
}

export function regionCenter(
  bounds: RegionBounds,
): [number, number, number] {
  return [
    (
      bounds.xMin +
      bounds.xMax
    ) / 2,
    (
      bounds.yMin +
      bounds.yMax
    ) / 2,
    (
      bounds.zMin +
      bounds.zMax
    ) / 2,
  ]
}

export function resizeRegionFromHandle(
  bounds: RegionBounds,
  rect: RegionOverlayRect,
  handle: RegionHandle,
  pointerX: number,
  pointerY: number,
): RegionBounds {
  const next = {
    ...bounds,
  }

  const safePointerX =
    clamp(
      pointerX,
      Math.min(
        rect.tileLeftPx,
        rect.tileRightPx,
      ),
      Math.max(
        rect.tileLeftPx,
        rect.tileRightPx,
      ),
    )

  const safePointerY =
    clamp(
      pointerY,
      Math.min(
        rect.tileTopPx,
        rect.tileBottomPx,
      ),
      Math.max(
        rect.tileTopPx,
        rect.tileBottomPx,
      ),
    )

  const horizontalValue =
    clamp(
      screenToValue(
        safePointerX,
        rect.horizontalMinPx,
        rect.horizontalMaxPx,
        horizontalMinValue(
          bounds,
          rect.plane,
        ),
        horizontalMaxValue(
          bounds,
          rect.plane,
        ),
      ),
      rect.horizontalLimitMin,
      rect.horizontalLimitMax,
    )

  const verticalValue =
    clamp(
      screenToValue(
        safePointerY,
        rect.verticalMinPx,
        rect.verticalMaxPx,
        verticalMinValue(
          bounds,
          rect.plane,
        ),
        verticalMaxValue(
          bounds,
          rect.plane,
        ),
      ),
      rect.verticalLimitMin,
      rect.verticalLimitMax,
    )

  if (
    handle.includes('w')
  ) {
    setHorizontalScreenSide(
      next,
      rect,
      'left',
      horizontalValue,
    )
  }

  if (
    handle.includes('e')
  ) {
    setHorizontalScreenSide(
      next,
      rect,
      'right',
      horizontalValue,
    )
  }

  if (
    handle.includes('n')
  ) {
    setVerticalScreenSide(
      next,
      rect,
      'top',
      verticalValue,
    )
  }

  if (
    handle.includes('s')
  ) {
    setVerticalScreenSide(
      next,
      rect,
      'bottom',
      verticalValue,
    )
  }

  return next
}

function horizontalMinValue(
  bounds: RegionBounds,
  plane: RegionPlane,
) {
  if (
    plane === 'sagittal'
  ) {
    return bounds.yMin
  }

  return bounds.xMin
}

function horizontalMaxValue(
  bounds: RegionBounds,
  plane: RegionPlane,
) {
  if (
    plane === 'sagittal'
  ) {
    return bounds.yMax
  }

  return bounds.xMax
}

function verticalMinValue(
  bounds: RegionBounds,
  plane: RegionPlane,
) {
  if (
    plane === 'axial'
  ) {
    return bounds.yMin
  }

  return bounds.zMin
}

function verticalMaxValue(
  bounds: RegionBounds,
  plane: RegionPlane,
) {
  if (
    plane === 'axial'
  ) {
    return bounds.yMax
  }

  return bounds.zMax
}

function setHorizontalScreenSide(
  bounds: RegionBounds,
  rect: RegionOverlayRect,
  side: 'left' | 'right',
  value: number,
) {
  const minimumAppearsLeft =
    rect.horizontalMinPx <=
    rect.horizontalMaxPx

  const editMinimum =
    side === 'left'
      ? minimumAppearsLeft
      : !minimumAppearsLeft

  if (
    rect.plane === 'sagittal'
  ) {
    setAxisBoundary(
      bounds,
      editMinimum
        ? 'yMin'
        : 'yMax',
      value,
    )

    return
  }

  setAxisBoundary(
    bounds,
    editMinimum
      ? 'xMin'
      : 'xMax',
    value,
  )
}

function setVerticalScreenSide(
  bounds: RegionBounds,
  rect: RegionOverlayRect,
  side: 'top' | 'bottom',
  value: number,
) {
  const minimumAppearsTop =
    rect.verticalMinPx <=
    rect.verticalMaxPx

  const editMinimum =
    side === 'top'
      ? minimumAppearsTop
      : !minimumAppearsTop

  if (
    rect.plane === 'axial'
  ) {
    setAxisBoundary(
      bounds,
      editMinimum
        ? 'yMin'
        : 'yMax',
      value,
    )

    return
  }

  setAxisBoundary(
    bounds,
    editMinimum
      ? 'zMin'
      : 'zMax',
    value,
  )
}

type RegionBoundaryKey =
  | 'xMin'
  | 'xMax'
  | 'yMin'
  | 'yMax'
  | 'zMin'
  | 'zMax'

function setAxisBoundary(
  bounds: RegionBounds,
  key: RegionBoundaryKey,
  rawValue: number,
) {
  const value =
    roundMni(rawValue)

  const minimumExtent =
    0.5

  if (key === 'xMin') {
    bounds.xMin =
      Math.min(
        value,
        bounds.xMax -
          minimumExtent,
      )
    return
  }

  if (key === 'xMax') {
    bounds.xMax =
      Math.max(
        value,
        bounds.xMin +
          minimumExtent,
      )
    return
  }

  if (key === 'yMin') {
    bounds.yMin =
      Math.min(
        value,
        bounds.yMax -
          minimumExtent,
      )
    return
  }

  if (key === 'yMax') {
    bounds.yMax =
      Math.max(
        value,
        bounds.yMin +
          minimumExtent,
      )
    return
  }

  if (key === 'zMin') {
    bounds.zMin =
      Math.min(
        value,
        bounds.zMax -
          minimumExtent,
      )
    return
  }

  bounds.zMax =
    Math.max(
      value,
      bounds.zMin +
        minimumExtent,
    )
}

function screenToValue(
  screenValue: number,
  screenAtMinimum: number,
  screenAtMaximum: number,
  minimum: number,
  maximum: number,
) {
  const pixelSpan =
    screenAtMaximum -
    screenAtMinimum

  if (
    Math.abs(pixelSpan) <
    0.001
  ) {
    return minimum
  }

  const fraction =
    (
      screenValue -
      screenAtMinimum
    ) /
    pixelSpan

  return (
    minimum +
    fraction *
      (maximum - minimum)
  )
}

function normalizeBounds(
  a: number,
  b: number,
): [number, number] {
  return [
    Math.min(a, b),
    Math.max(a, b),
  ]
}

function roundMni(
  value: number,
) {
  return (
    Math.round(value * 10) /
    10
  )
}

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.max(
    min,
    Math.min(max, value),
  )
}
