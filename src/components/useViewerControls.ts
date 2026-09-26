import {
  useEffect,
  useRef,
  useState,
} from 'react'
import type {
  Niivue,
} from '@niivue/niivue'

type MutableRef<T> = {
  current: T
}

type UseViewerControlsArgs = {
  nvRef: MutableRef<Niivue | null>
  viewerReady: boolean
}

export function useViewerControls({
  nvRef,
  viewerReady,
}: UseViewerControlsArgs) {
  const [zoom, setZoom] =
    useState(1)

  const [panMode, setPanMode] =
    useState(false)

  const [
    crosshairsVisible,
    setCrosshairsVisible,
  ] = useState(true)

  const panModeRef =
    useRef(false)

  useEffect(() => {
    panModeRef.current =
      panMode
  }, [panMode])

  function applyZoom(
    nextZoom: number,
  ) {
    const nv =
      nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    const safeZoom =
      Math.min(
        4,
        Math.max(
          0.5,
          nextZoom,
        ),
      )

    setZoom(safeZoom)

    const currentPan =
      nv.scene.pan2Dxyzmm ??
      [
        0,
        0,
        0,
        1,
      ]

    nv.setPan2Dxyzmm([
      currentPan[0],
      currentPan[1],
      currentPan[2],
      safeZoom,
    ])

    nv.setScale(
      safeZoom,
    )

    nv.drawScene()
  }

  function zoomIn() {
    applyZoom(
      zoom * 1.25,
    )
  }

  function zoomOut() {
    applyZoom(
      zoom / 1.25,
    )
  }

  function resetZoom() {
    const nv =
      nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    setZoom(1)

    nv.setPan2Dxyzmm([
      0,
      0,
      0,
      1,
    ])

    nv.setScale(1)
    nv.drawScene()
  }

  function togglePan() {
    setPanMode(
      (current) =>
        !current,
    )
  }

  function toggleCrosshairs() {
    const nv =
      nvRef.current

    if (!nv || !viewerReady) {
      return
    }

    const nextVisible =
      !crosshairsVisible

    setCrosshairsVisible(
      nextVisible,
    )

    nv.setCrosshairWidth(
      nextVisible
        ? 1
        : 0,
    )

    nv.opts.show3Dcrosshair =
      nextVisible

    nv.drawScene()
  }

  return {
    zoom,
    panMode,
    panModeRef,
    crosshairsVisible,
    zoomIn,
    zoomOut,
    resetZoom,
    togglePan,
    toggleCrosshairs,
  }
}
