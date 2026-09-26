import {
  SLICE_TYPE,
  type Niivue,
} from '@niivue/niivue'
import {
  regionCenter,
} from './regionBounds'
import type {
  RegionBounds,
  RegionCuboidProjection,
  RegionOverlayRect,
} from './regionTypes'

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
