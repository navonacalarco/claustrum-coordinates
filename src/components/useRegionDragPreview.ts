import {
  useEffect,
  useRef,
  useState,
} from 'react'
import type {
  LiveRegionRect,
} from './RegionBoxOverlay'

type ElementRef<T> = {
  current: T | null
}

type UseRegionDragPreviewArgs = {
  canvasRef:
    ElementRef<HTMLCanvasElement>
  containerRef:
    ElementRef<HTMLDivElement>
  viewerReady: boolean
  regionDrawing: boolean
}

export function useRegionDragPreview({
  canvasRef,
  containerRef,
  viewerReady,
  regionDrawing,
}: UseRegionDragPreviewArgs) {
  const [
    preview,
    setPreview,
  ] = useState<
    LiveRegionRect | null
  >(null)

  const dragStartRef =
    useRef<{
      x: number
      y: number
    } | null>(null)

  useEffect(() => {
    const canvas =
      canvasRef.current

    const container =
      containerRef.current

    if (
      !canvas ||
      !container ||
      !viewerReady ||
      !regionDrawing
    ) {
      setPreview(null)
      dragStartRef.current =
        null
      return
    }

    const getPoint = (
      event: MouseEvent,
    ) => {
      const rect =
        container
          .getBoundingClientRect()

      return {
        x:
          event.clientX -
          rect.left,
        y:
          event.clientY -
          rect.top,
      }
    }

    const handleMouseDown = (
      event: MouseEvent,
    ) => {
      if (event.button !== 0) {
        return
      }

      const point =
        getPoint(event)

      dragStartRef.current =
        point

      setPreview({
        left: point.x,
        top: point.y,
        width: 0,
        height: 0,
      })
    }

    const handleMouseMove = (
      event: MouseEvent,
    ) => {
      const start =
        dragStartRef.current

      if (!start) {
        return
      }

      const point =
        getPoint(event)

      setPreview({
        left:
          Math.min(
            start.x,
            point.x,
          ),
        top:
          Math.min(
            start.y,
            point.y,
          ),
        width:
          Math.abs(
            point.x -
            start.x,
          ),
        height:
          Math.abs(
            point.y -
            start.y,
          ),
      })
    }

    const finishDrag = () => {
      dragStartRef.current =
        null

      window.setTimeout(
        () =>
          setPreview(null),
        40,
      )
    }

    canvas.addEventListener(
      'mousedown',
      handleMouseDown,
    )

    window.addEventListener(
      'mousemove',
      handleMouseMove,
    )

    window.addEventListener(
      'mouseup',
      finishDrag,
    )

    return () => {
      canvas.removeEventListener(
        'mousedown',
        handleMouseDown,
      )

      window.removeEventListener(
        'mousemove',
        handleMouseMove,
      )

      window.removeEventListener(
        'mouseup',
        finishDrag,
      )
    }
  }, [
    canvasRef,
    containerRef,
    regionDrawing,
    viewerReady,
  ])

  return preview
}
