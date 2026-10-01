import type {
  ViewMode,
} from './brainViewerTypes'

type BrainViewerHeaderProps = {
  viewMode: ViewMode
  regionDrawing: boolean
  panMode: boolean
  crosshairsVisible: boolean

  onViewModeChange?: (
    viewMode: ViewMode,
  ) => void

  onZoomOut: () => void
  onResetZoom: () => void
  onZoomIn: () => void
  onTogglePan: () => void
  onToggleCrosshairs: () => void
}

function BrainViewerHeader({
  viewMode,
  regionDrawing,
  panMode,
  crosshairsVisible,
  onViewModeChange,
  onZoomOut,
  onResetZoom,
  onZoomIn,
  onTogglePan,
  onToggleCrosshairs,
}: BrainViewerHeaderProps) {
  return (
    <div className="brain-viewer-header">
      <div className="view-mode-bar brain-header-views">
        <ViewButton
          label="4 views"
          active={
            viewMode === 'multi'
          }
          onClick={() =>
            onViewModeChange?.('multi')
          }
        />

        <ViewButton
          label="Coronal"
          active={
            viewMode === 'coronal'
          }
          onClick={() =>
            onViewModeChange?.('coronal')
          }
        />

        <ViewButton
          label="Sagittal"
          active={
            viewMode === 'sagittal'
          }
          onClick={() =>
            onViewModeChange?.('sagittal')
          }
        />

        <ViewButton
          label="Axial"
          active={
            viewMode === 'axial'
          }
          onClick={() =>
            onViewModeChange?.('axial')
          }
        />

        <ViewButton
          label="3D"
          active={
            viewMode === 'render'
          }
          disabled={
            regionDrawing
          }
          title={
            regionDrawing
              ? 'Finish region drawing before switching to 3D'
              : undefined
          }
          onClick={() =>
            onViewModeChange?.('render')
          }
        />
      </div>


      <div className="zoom-controls brain-header-tools">
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>

        <button
          type="button"
          className="zoom-reset"
          onClick={onResetZoom}
          title="Reset pan and zoom"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>

        <span className="viewer-control-divider" />

        <button
          type="button"
          className={
            panMode
              ? 'pan-button active'
              : 'pan-button'
          }
          disabled={
            regionDrawing
          }
          onClick={onTogglePan}
          title={
            regionDrawing
              ? 'Pan is disabled while drawing a region'
              : panMode
                ? 'Turn pan mode off'
                : 'Turn pan mode on'
          }
        >
          Pan
        </button>

        <span className="viewer-control-divider" />

        <button
          type="button"
          className={
            crosshairsVisible
              ? 'crosshair-button active'
              : 'crosshair-button'
          }
          onClick={
            onToggleCrosshairs
          }
          title={
            crosshairsVisible
              ? 'Hide crosshairs'
              : 'Show crosshairs'
          }
          aria-pressed={
            crosshairsVisible
          }
        >
          Crosshairs
        </button>
      </div>
    </div>
  )
}

type ViewButtonProps = {
  label: string
  active: boolean
  disabled?: boolean
  title?: string
  onClick: () => void
}

function ViewButton({
  label,
  active,
  disabled = false,
  title,
  onClick,
}: ViewButtonProps) {
  return (
    <button
      type="button"
      className={
        active
          ? 'active'
          : ''
      }
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default BrainViewerHeader


