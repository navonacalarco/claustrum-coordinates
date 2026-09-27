import {
  useEffect,
  useState,
} from 'react'

export type {
  RegionBounds,
} from './regionSelection'

import {
  type RegionBounds,
} from './regionSelection'

type RegionSelectorProps = {
  bounds: RegionBounds | null
  draftBounds: RegionBounds | null
  drawing: boolean

  onStartDrawing: () => void

  onDraftChange: (
    bounds: RegionBounds,
  ) => void

  onApplyDrawing: () => void
  onCancelDrawing: () => void
  onClear: () => void
}

type DraftBounds = {
  xMin: string
  xMax: string
  yMin: string
  yMax: string
  zMin: string
  zMax: string
}

const emptyDraft:
  DraftBounds = {
  xMin: '',
  xMax: '',
  yMin: '',
  yMax: '',
  zMin: '',
  zMax: '',
}

function RegionSelector({
  bounds,
  draftBounds,
  drawing,
  onStartDrawing,
  onDraftChange,
  onApplyDrawing,
  onCancelDrawing,
  onClear,
}: RegionSelectorProps) {
  const [open, setOpen] =
    useState(false)

  const [draft, setDraft] =
    useState<DraftBounds>(
      emptyDraft,
    )

  const [error, setError] =
    useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    const source =
      draftBounds ??
      bounds

    if (source) {
      setDraft(
        boundsToDraft(
          source,
        ),
      )
    } else {
      setDraft(
        emptyDraft,
      )
    }

    setError('')
  }, [
    open,
    draftBounds,
    bounds,
  ])

  useEffect(() => {
    if (!drawing) {
      setOpen(false)
    }
  }, [drawing])

  function updateDraft(
    key: keyof DraftBounds,
    value: string,
  ) {
    setDraft(
      (current) => ({
        ...current,
        [key]: value,
      }),
    )

    setError('')
  }

  function updateFromNumbers() {
    const parsed =
      parseDraft(
        draft,
      )

    if (
      parsed.error
    ) {
      setError(
        parsed.error,
      )
      return
    }

    onDraftChange(
      parsed.bounds,
    )

    setOpen(false)
  }

  if (drawing) {
    return (
      <div className="region-selector">
        <div className="region-drawing-controls">
          <span className="region-drawing-status">
            {bounds
              ? 'Edit box'
              : 'Draw box'}
          </span>

          <button
            type="button"
            className="region-text-button"
            onClick={() =>
              setOpen(true)
            }
          >
            Enter bounds
          </button>

          <button
            type="button"
            className="region-apply-button region-footer-apply"
            disabled={
              !draftBounds
            }
            onClick={
              onApplyDrawing
            }
          >
            Apply
          </button>

          <button
            type="button"
            className="region-text-button"
            onClick={
              onCancelDrawing
            }
          >
            Cancel
          </button>
        </div>

        {open && (
          <RegionPopover
            draft={draft}
            error={error}
            actionLabel="Update box"
            onDraftChange={
              updateDraft
            }
            onClose={() =>
              setOpen(false)
            }
            onApply={
              updateFromNumbers
            }
          />
        )}
      </div>
    )
  }

  return (
    <div className="region-selector">
      {!bounds ? (
        <button
          type="button"
          className="button small viewer-region-button"
          onClick={
            onStartDrawing
          }
        >
          Set spatial filter
        </button>
      ) : (
        <div className="region-active">
          <button
            type="button"
            className="region-text-button"
            onClick={
              onStartDrawing
            }
          >
            Edit box
          </button>

          <button
            type="button"
            className="region-text-button"
            onClick={
              onClear
            }
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

type RegionPopoverProps = {
  draft: DraftBounds
  error: string
  actionLabel: string
  onDraftChange: (
    key: keyof DraftBounds,
    value: string,
  ) => void

  onClose: () => void
  onApply: () => void
}

function RegionPopover({
  draft,
  error,
  actionLabel,
  onDraftChange,
  onClose,
  onApply,
}: RegionPopoverProps) {
  return (
    <div
      className="region-popover"
      role="dialog"
      aria-label="Edit spatial bounds"
    >
      <button
        type="button"
        className="region-popover-close region-popover-close-minimal"
        aria-label="Close bounds"
        onClick={
          onClose
        }
      >
        ×
      </button>

      <div className="region-axis-row">
        <span className="region-axis-label">
          x
        </span>

        <CoordinateField
          label="min"
          value={draft.xMin}
          onChange={(value) =>
            onDraftChange(
              'xMin',
              value,
            )
          }
        />

        <CoordinateField
          label="max"
          value={draft.xMax}
          onChange={(value) =>
            onDraftChange(
              'xMax',
              value,
            )
          }
        />
      </div>

      <div className="region-axis-row">
        <span className="region-axis-label">
          y
        </span>

        <CoordinateField
          label="min"
          value={draft.yMin}
          onChange={(value) =>
            onDraftChange(
              'yMin',
              value,
            )
          }
        />

        <CoordinateField
          label="max"
          value={draft.yMax}
          onChange={(value) =>
            onDraftChange(
              'yMax',
              value,
            )
          }
        />
      </div>

      <div className="region-axis-row">
        <span className="region-axis-label">
          z
        </span>

        <CoordinateField
          label="min"
          value={draft.zMin}
          onChange={(value) =>
            onDraftChange(
              'zMin',
              value,
            )
          }
        />

        <CoordinateField
          label="max"
          value={draft.zMax}
          onChange={(value) =>
            onDraftChange(
              'zMax',
              value,
            )
          }
        />
      </div>

      {error && (
        <div className="region-error">
          {error}
        </div>
      )}

      <div className="region-popover-actions">
        <button
          type="button"
          className="region-cancel-button"
          onClick={
            onClose
          }
        >
          Cancel
        </button>

        <button
          type="button"
          className="region-apply-button"
          onClick={
            onApply
          }
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

type CoordinateFieldProps = {
  label: string
  value: string

  onChange: (
    value: string,
  ) => void
}

function CoordinateField({
  label,
  value,
  onChange,
}: CoordinateFieldProps) {
  return (
    <label className="region-coordinate-field">
      <span>
        {label}
      </span>

      <input
        type="number"
        step="0.1"
        value={value}
        inputMode="decimal"
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
      />
    </label>
  )
}

function boundsToDraft(
  bounds: RegionBounds,
): DraftBounds {
  return {
    xMin: String(
      bounds.xMin,
    ),
    xMax: String(
      bounds.xMax,
    ),
    yMin: String(
      bounds.yMin,
    ),
    yMax: String(
      bounds.yMax,
    ),
    zMin: String(
      bounds.zMin,
    ),
    zMax: String(
      bounds.zMax,
    ),
  }
}

function parseDraft(
  draft: DraftBounds,
):
  | {
      error: string
      bounds?: never
    }
  | {
      error?: never
      bounds: RegionBounds
    } {
  const allValues = [
    draft.xMin,
    draft.xMax,
    draft.yMin,
    draft.yMax,
    draft.zMin,
    draft.zMax,
  ]

  if (
    allValues.some(
      (value) =>
        value.trim() === '',
    )
  ) {
    return {
      error:
        'Enter all six coordinates.',
    }
  }

  const bounds:
    RegionBounds = {
    xMin:
      Number(draft.xMin),
    xMax:
      Number(draft.xMax),
    yMin:
      Number(draft.yMin),
    yMax:
      Number(draft.yMax),
    zMin:
      Number(draft.zMin),
    zMax:
      Number(draft.zMax),
  }

  if (
    Object.values(
      bounds,
    ).some(
      (value) =>
        !Number.isFinite(
          value,
        ),
    )
  ) {
    return {
      error:
        'Enter valid numeric coordinates.',
    }
  }

  if (
    bounds.xMin >
      bounds.xMax ||
    bounds.yMin >
      bounds.yMax ||
    bounds.zMin >
      bounds.zMax
  ) {
    return {
      error:
        'Each minimum must be less than or equal to its maximum.',
    }
  }

  return {
    bounds,
  }
}

export default RegionSelector
