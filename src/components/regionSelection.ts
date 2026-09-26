import {
  SLICE_TYPE,
  type Niivue,
} from '@niivue/niivue'

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

  /*
   * Pixel positions corresponding specifically to
   * the MNI minimum and maximum on each displayed axis.
   * These retain orientation information even when the
   * screen axis is reversed.
   */
  horizontalMinPx: number
  horizontalMaxPx: number
  verticalMinPx: number
  verticalMaxPx: number

  /*
   * Hard interaction limits.
   *
   * The pointer is clamped to the NiiVue tile and the
   * resulting coordinate is clamped to the valid MNI
   * extent of the template. This prevents a handle from
   * creating an arbitrarily large box when dragged outside
   * the visible slice.
   */
  tileLeftPx: number
  tileTopPx: number
  tileRightPx: number
  tileBottomPx: number

  horizontalLimitMin: number
  horizontalLimitMax: number
  verticalLimitMin: number
  verticalLimitMax: number
}

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

/*
 * Convert the same 3D MNI cuboid into its
 * rectangular projection in each 2D tile.
 *
 * This deliberately uses NiiVue only for
 * coordinate projection. React owns the box
 * rendering, so it remains visible after a
 * drag ends.
 */
export function projectRegionBounds(
  nv: Niivue,
  bounds: RegionBounds | null,
  canvas: HTMLCanvasElement,
): RegionOverlayRect[] {
  if (
    !bounds ||
    canvas.width <= 0 ||
    canvas.height <= 0
  ) {
    return []
  }

  const [
    centerX,
    centerY,
    centerZ,
  ] = regionCenter(bounds)

  const definitions: Array<{
    plane:
      | 'coronal'
      | 'sagittal'
      | 'axial'
    sliceType: SLICE_TYPE
    first: [number, number, number]
    second: [number, number, number]
  }> = [
    {
      plane: 'coronal',
      sliceType: SLICE_TYPE.CORONAL,
      first: [
        bounds.xMin,
        centerY,
        bounds.zMin,
      ],
      second: [
        bounds.xMax,
        centerY,
        bounds.zMax,
      ],
    },
    {
      plane: 'sagittal',
      sliceType: SLICE_TYPE.SAGITTAL,
      first: [
        centerX,
        bounds.yMin,
        bounds.zMin,
      ],
      second: [
        centerX,
        bounds.yMax,
        bounds.zMax,
      ],
    },
    {
      plane: 'axial',
      sliceType: SLICE_TYPE.AXIAL,
      first: [
        bounds.xMin,
        bounds.yMin,
        centerZ,
      ],
      second: [
        bounds.xMax,
        bounds.yMax,
        centerZ,
      ],
    },
  ]

  const cssScaleX =
    canvas.clientWidth /
    canvas.width

  const cssScaleY =
    canvas.clientHeight /
    canvas.height

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
    return []
  }

  const rects:
    RegionOverlayRect[] = []

  for (
    const definition
      of definitions
  ) {
    const firstFrac =
      nv.mm2frac(
        definition.first,
      )

    const secondFrac =
      nv.mm2frac(
        definition.second,
      )

    const firstCanvas =
      nv.frac2canvasPosWithTile(
        firstFrac,
        definition.sliceType,
      )

    const secondCanvas =
      nv.frac2canvasPosWithTile(
        secondFrac,
        definition.sliceType,
      )

    if (
      !firstCanvas ||
      !secondCanvas ||
      firstCanvas.tileIndex !==
        secondCanvas.tileIndex
    ) {
      continue
    }

    const tile =
      nv.screenSlices[
        firstCanvas.tileIndex
      ]

    const ltwh =
      tile?.leftTopWidthHeight

    if (
      !ltwh ||
      ltwh.length < 4
    ) {
      continue
    }

    const tileLeftPx =
      Number(ltwh[0]) *
      cssScaleX

    const tileTopPx =
      Number(ltwh[1]) *
      cssScaleY

    const tileRightPx =
      (
        Number(ltwh[0]) +
        Number(ltwh[2])
      ) *
      cssScaleX

    const tileBottomPx =
      (
        Number(ltwh[1]) +
        Number(ltwh[3])
      ) *
      cssScaleY

    const x1 =
      firstCanvas.pos[0] *
      cssScaleX

    const y1 =
      firstCanvas.pos[1] *
      cssScaleY

    const x2 =
      secondCanvas.pos[0] *
      cssScaleX

    const y2 =
      secondCanvas.pos[1] *
      cssScaleY

    let horizontalLimitMin:
      number
    let horizontalLimitMax:
      number
    let verticalLimitMin:
      number
    let verticalLimitMax:
      number

    if (
      definition.plane ===
      'coronal'
    ) {
      horizontalLimitMin =
        Number(minExtent[0])
      horizontalLimitMax =
        Number(maxExtent[0])
      verticalLimitMin =
        Number(minExtent[2])
      verticalLimitMax =
        Number(maxExtent[2])
    } else if (
      definition.plane ===
      'sagittal'
    ) {
      horizontalLimitMin =
        Number(minExtent[1])
      horizontalLimitMax =
        Number(maxExtent[1])
      verticalLimitMin =
        Number(minExtent[2])
      verticalLimitMax =
        Number(maxExtent[2])
    } else {
      horizontalLimitMin =
        Number(minExtent[0])
      horizontalLimitMax =
        Number(maxExtent[0])
      verticalLimitMin =
        Number(minExtent[1])
      verticalLimitMax =
        Number(maxExtent[1])
    }

    rects.push({
      plane:
        definition.plane,
      left:
        Math.min(x1, x2),
      top:
        Math.min(y1, y2),
      width:
        Math.abs(x2 - x1),
      height:
        Math.abs(y2 - y1),

      horizontalMinPx:
        x1,
      horizontalMaxPx:
        x2,
      verticalMinPx:
        y1,
      verticalMaxPx:
        y2,

      tileLeftPx,
      tileTopPx,
      tileRightPx,
      tileBottomPx,

      horizontalLimitMin,
      horizontalLimitMax,
      verticalLimitMin,
      verticalLimitMax,
    })
  }

  return rects
}

/*
 * Project the 8 corners of the current MNI cuboid into
 * NiiVue's 3D render tile. This is display-only: React
 * draws the projected cube while NiiVue remains responsible
 * for the underlying 3D brain and camera.
 */
export function projectRegionCuboid3D(
  nv: Niivue,
  bounds: RegionBounds | null,
  canvas: HTMLCanvasElement,
): RegionCuboidProjection | null {
  if (
    !bounds ||
    canvas.width <= 0 ||
    canvas.height <= 0
  ) {
    return null
  }

  const renderTile =
    nv.screenSlices.find(
      (tile) =>
        tile.axCorSag ===
        SLICE_TYPE.RENDER,
    )

  if (!renderTile) {
    return null
  }

  const ltwh =
    renderTile.leftTopWidthHeight

  if (
    !ltwh ||
    ltwh.length < 4 ||
    ltwh[2] <= 0 ||
    ltwh[3] <= 0
  ) {
    return null
  }

  const matrices =
    nv.calculateMvpMatrix(
      null,
      ltwh,
      nv.scene.renderAzimuth,
      nv.scene.renderElevation,
    )

  const mvp =
    matrices[0]

  const corners:
    Array<[number, number, number]> = [
      [
        bounds.xMin,
        bounds.yMin,
        bounds.zMin,
      ],
      [
        bounds.xMax,
        bounds.yMin,
        bounds.zMin,
      ],
      [
        bounds.xMax,
        bounds.yMax,
        bounds.zMin,
      ],
      [
        bounds.xMin,
        bounds.yMax,
        bounds.zMin,
      ],
      [
        bounds.xMin,
        bounds.yMin,
        bounds.zMax,
      ],
      [
        bounds.xMax,
        bounds.yMin,
        bounds.zMax,
      ],
      [
        bounds.xMax,
        bounds.yMax,
        bounds.zMax,
      ],
      [
        bounds.xMin,
        bounds.yMax,
        bounds.zMax,
      ],
    ]

  const cssScaleX =
    canvas.clientWidth /
    canvas.width

  const cssScaleY =
    canvas.clientHeight /
    canvas.height

  const points =
    corners.map(
      (corner) => {
        const screen =
          nv.calculateScreenPoint(
            corner,
            mvp,
            ltwh,
          )

        return {
          x:
            Number(screen[0]) *
            cssScaleX,
          y:
            Number(screen[1]) *
            cssScaleY,
          depth:
            Number(screen[2]),
        }
      },
    )

  if (
    points.some(
      (point) =>
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.y) ||
        !Number.isFinite(point.depth),
    )
  ) {
    return null
  }

  return {
    points,

    viewport: {
      left:
        Number(ltwh[0]) *
        cssScaleX,
      top:
        Number(ltwh[1]) *
        cssScaleY,
      width:
        Number(ltwh[2]) *
        cssScaleX,
      height:
        Number(ltwh[3]) *
        cssScaleY,
    },
  }
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
