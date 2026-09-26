import {
  useRef,
} from 'react'
import {
  resizeRegionFromHandle,
  type RegionBounds,
  type RegionCuboidProjection,
  type RegionHandle,
  type RegionOverlayRect,
} from './regionSelection'

export type LiveRegionRect = {
  left: number
  top: number
  width: number
  height: number
}

type RegionBoxOverlayProps = {
  drawing: boolean
  bounds: RegionBounds | null
  rects: RegionOverlayRect[]
  cuboid3D: RegionCuboidProjection | null
  liveRect: LiveRegionRect | null

  onBoundsChange: (
    bounds: RegionBounds,
  ) => void
}

type HandleDrag = {
  pointerId: number
  handle: RegionHandle
  rect: RegionOverlayRect
  bounds: RegionBounds
}

const handles:
  RegionHandle[] = [
    'nw',
    'n',
    'ne',
    'e',
    'se',
    's',
    'sw',
    'w',
  ]

const cuboidFaces = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [0, 1, 5, 4],
  [1, 2, 6, 5],
  [2, 3, 7, 6],
  [3, 0, 4, 7],
] as const

const cuboidEdges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
] as const

function RegionBoxOverlay({
  drawing,
  bounds,
  rects,
  cuboid3D,
  liveRect,
  onBoundsChange,
}: RegionBoxOverlayProps) {
  const overlayRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const dragRef =
    useRef<HandleDrag | null>(
      null,
    )

  function handlePointerDown(
    event:
      React.PointerEvent<HTMLButtonElement>,
    rect: RegionOverlayRect,
    handle: RegionHandle,
  ) {
    if (
      !drawing ||
      !bounds
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    event.currentTarget
      .setPointerCapture(
        event.pointerId,
      )

    dragRef.current = {
      pointerId:
        event.pointerId,
      handle,
      rect: {
        ...rect,
      },
      bounds: {
        ...bounds,
      },
    }
  }

  function handlePointerMove(
    event:
      React.PointerEvent<HTMLButtonElement>,
  ) {
    const drag =
      dragRef.current

    const overlay =
      overlayRef.current

    if (
      !drag ||
      !overlay ||
      drag.pointerId !==
        event.pointerId
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const overlayRect =
      overlay.getBoundingClientRect()

    const pointerX =
      event.clientX -
      overlayRect.left

    const pointerY =
      event.clientY -
      overlayRect.top

    onBoundsChange(
      resizeRegionFromHandle(
        drag.bounds,
        drag.rect,
        drag.handle,
        pointerX,
        pointerY,
      ),
    )
  }

  function finishPointerDrag(
    event:
      React.PointerEvent<HTMLButtonElement>,
  ) {
    const drag =
      dragRef.current

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (
      event.currentTarget
        .hasPointerCapture(
          event.pointerId,
        )
    ) {
      event.currentTarget
        .releasePointerCapture(
          event.pointerId,
        )
    }

    dragRef.current = null
  }

  return (
    <div
      ref={overlayRef}
      className={[
        'region-box-overlay',
        drawing
          ? 'editing'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden={
        drawing
          ? undefined
          : true
      }
    >
      {rects.map(
        (rect) => (
          <div
            key={rect.plane}
            className={[
              'region-box-rect',
              `region-box-${rect.plane}`,
            ].join(' ')}
            style={{
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            }}
          >
            {drawing &&
              bounds &&
              handles.map(
                (handle) => (
                  <button
                    key={handle}
                    type="button"
                    className={[
                      'region-box-handle',
                      `handle-${handle}`,
                    ].join(' ')}
                    aria-label={
                      `${rect.plane} ${handle} resize handle`
                    }
                    onPointerDown={(
                      event,
                    ) =>
                      handlePointerDown(
                        event,
                        rect,
                        handle,
                      )
                    }
                    onPointerMove={
                      handlePointerMove
                    }
                    onPointerUp={
                      finishPointerDrag
                    }
                    onPointerCancel={
                      finishPointerDrag
                    }
                  />
                ),
              )}
          </div>
        ),
      )}

      {cuboid3D && (
        <svg
          className="region-cuboid-3d"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          <defs>
            <clipPath
              id="region-cuboid-render-clip"
              clipPathUnits="userSpaceOnUse"
            >
              <rect
                x={
                  cuboid3D
                    .viewport.left
                }
                y={
                  cuboid3D
                    .viewport.top
                }
                width={
                  cuboid3D
                    .viewport.width
                }
                height={
                  cuboid3D
                    .viewport.height
                }
              />
            </clipPath>
          </defs>

          <g
            clipPath="url(#region-cuboid-render-clip)"
          >
          {cuboidFaces
            .map(
              (face) => ({
                face,
                depth:
                  face.reduce(
                    (
                      total,
                      index,
                    ) =>
                      total +
                      cuboid3D
                        .points[index]
                        .depth,
                    0,
                  ) /
                  face.length,
              }),
            )
            .sort(
              (a, b) =>
                b.depth -
                a.depth,
            )
            .map(
              ({
                face,
              },
              faceIndex,
              ) => (
                <polygon
                  key={
                    `face-${faceIndex}`
                  }
                  className="region-cuboid-face"
                  points={
                    face
                      .map(
                        (index) =>
                          `${
                            cuboid3D
                              .points[
                                index
                              ].x
                          },${
                            cuboid3D
                              .points[
                                index
                              ].y
                          }`,
                      )
                      .join(' ')
                  }
                />
              ),
            )}

          {cuboidEdges.map(
            (
              [
                first,
                second,
              ],
              edgeIndex,
            ) => (
              <line
                key={
                  `edge-${edgeIndex}`
                }
                className="region-cuboid-edge"
                x1={
                  cuboid3D
                    .points[first].x
                }
                y1={
                  cuboid3D
                    .points[first].y
                }
                x2={
                  cuboid3D
                    .points[second].x
                }
                y2={
                  cuboid3D
                    .points[second].y
                }
              />
            ),
          )}
          </g>
        </svg>
      )}

      {drawing &&
        liveRect && (
          <div
            className="region-box-live"
            style={{
              left:
                liveRect.left,
              top:
                liveRect.top,
              width:
                liveRect.width,
              height:
                liveRect.height,
            }}
          />
        )}
    </div>
  )
}

export default RegionBoxOverlay
