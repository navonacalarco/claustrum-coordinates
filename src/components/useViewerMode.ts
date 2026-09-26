import {
  useEffect,
} from 'react'
import {
  MULTIPLANAR_TYPE,
  SHOW_RENDER,
  SLICE_TYPE,
  type Niivue,
} from '@niivue/niivue'
import type {
  ViewMode,
} from './brainViewerTypes'

type MutableRef<T> = {
  current: T
}

type UseViewerModeArgs = {
  nvRef: MutableRef<Niivue | null>
  viewerReady: boolean
  viewMode: ViewMode
}

export function useViewerMode({
  nvRef,
  viewerReady,
  viewMode,
}: UseViewerModeArgs) {
  useEffect(() => {
    const nv =
      nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    if (viewMode === 'multi') {
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
    nvRef,
    viewMode,
    viewerReady,
  ])
}
