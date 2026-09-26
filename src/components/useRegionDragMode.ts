import {
  useEffect,
  useRef,
} from 'react'
import {
  DRAG_MODE,
  type MouseEventConfig,
  type Niivue,
} from '@niivue/niivue'

type MutableRef<T> = {
  current: T
}

type UseRegionDragModeArgs = {
  nvRef: MutableRef<Niivue | null>
  viewerReady: boolean
  regionDrawing: boolean
  panMode: boolean
}

export function useRegionDragMode({
  nvRef,
  viewerReady,
  regionDrawing,
  panMode,
}: UseRegionDragModeArgs) {
  const savedMouseEventConfigRef =
    useRef<
      MouseEventConfig | undefined
    >(undefined)

  const hasSavedMouseEventConfigRef =
    useRef(false)

  useEffect(() => {
    const nv =
      nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    if (regionDrawing) {
      if (
        !hasSavedMouseEventConfigRef.current
      ) {
        savedMouseEventConfigRef.current =
          nv.getMouseEventConfig()

        hasSavedMouseEventConfigRef.current =
          true
      }

      nv.setMouseEventConfig({
        leftButton: {
          primary:
            DRAG_MODE.callbackOnly,
          withShift:
            DRAG_MODE.callbackOnly,
          withCtrl:
            DRAG_MODE.callbackOnly,
        },
        rightButton:
          DRAG_MODE.callbackOnly,
        centerButton:
          DRAG_MODE.callbackOnly,
      })

      nv.setDragMode(
        DRAG_MODE.callbackOnly,
      )
    } else {
      if (
        hasSavedMouseEventConfigRef.current
      ) {
        nv.opts.mouseEventConfig =
          savedMouseEventConfigRef.current

        ;(nv as any)
          .clearActiveDragMode?.()

        hasSavedMouseEventConfigRef.current =
          false
      }

      nv.setDragMode(
        panMode
          ? 'pan'
          : 'contrast',
      )
    }

    nv.drawScene()
  }, [
    nvRef,
    regionDrawing,
    panMode,
    viewerReady,
  ])
}
