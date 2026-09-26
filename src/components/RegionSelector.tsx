import {
  useEffect,
  useState,
} from 'react'

export type RegionBounds = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zMin: number
  zMax: number
}

type RegionSelectorProps = {
  bounds: RegionBounds | null
  numberOfCoordinates: number
  numberOfStudies: number
  onApply: (
    bounds: RegionBounds,
  ) => void
  onClear: () => void
  onDownload: () => void
}

type DraftBounds = {
  xMin: string
  xMax: string
  yMin: string
  yMax: string
  zMin: string
  zMax: string
}

const emptyDraft: DraftBounds = {
  xMin: '',
  xMax: '',
  yMin: '',
  yMax: '',
  zMin: '',
  zMax: '',
}

function RegionSelector({
  bounds,
  numberOfCoordinates,
  numberOfStudies,
  onApply,
  onClear,
  onDownload,
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

    if (bounds) {
      setDraft({
        xMin: String(bounds.xMin),
        xMax: String(bounds.xMax),
        yMin: String(bounds.yMin),
        yMax: String(bounds.yMax),
        zMin: String(bounds.zMin),
        zMax: String(bounds.zMax),
      })
    } else {
      setDraft(emptyDraft)
    }

    setError('')
  }, [
    open,
    bounds,
  ])

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

  function apply() {
    const parsed: RegionBounds = {
      xMin: Number(draft.xMin),
      xMax: Number(draft.xMax),
      yMin: Number(draft.yMin),
      yMax: Number(draft.yMax),
      zMin: Number(draft.zMin),
      zMax: Number(draft.zMax),
    }

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
      ) ||
      Object.values(parsed).some(
        (value) =>
          !Number.isFinite(value),
      )
    ) {
      setError(
        'Enter all six coordinates.',
      )
      return
    }

    if (
      parsed.xMin > parsed.xMax ||
      parsed.yMin > parsed.yMax ||
      parsed.zMin > parsed.zMax
    ) {
      setError(
        'Each minimum must be less than or equal to its maximum.',
      )
      return
    }

    onApply(parsed)
    setOpen(false)
  }

  return (
    <div className="region-selector">
      {!bounds ? (
        <button
          type="button"
          className="button small viewer-region-button"
          onClick={() =>
            setOpen(true)
          }
        >
          Select region
        </button>
      ) : (
        <div className="region-active">
          <span className="region-active-count">
            {numberOfCoordinates}{' '}
            {numberOfCoordinates === 1
              ? 'coordinate'
              : 'coordinates'}
            {' · '}
            {numberOfStudies}{' '}
            {numberOfStudies === 1
              ? 'study'
              : 'studies'}
          </span>

          <button
            type="button"
            className="region-text-button"
            onClick={() =>
              setOpen(true)
            }
          >
            Edit
          </button>

          {numberOfCoordinates > 0 && (
            <button
              type="button"
              className="region-download-button"
              onClick={onDownload}
            >
              Download CSV
            </button>
          )}

          <button
            type="button"
            className="region-text-button"
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      )}

      {open && (
        <div
          className="region-popover"
          role="dialog"
          aria-label="Select MNI region"
        >
          <div className="region-popover-header">
            <div>
              <strong>
                Select MNI region
              </strong>

              <span>
                Enter a rectangular
                bounding box in mm.
              </span>
            </div>

            <button
              type="button"
              className="region-popover-close"
              aria-label="Close region selector"
              onClick={() =>
                setOpen(false)
              }
            >
              ×
            </button>
          </div>

          <div className="region-axis-row">
            <span className="region-axis-label">
              x
            </span>

            <CoordinateField
              label="min"
              value={draft.xMin}
              onChange={(value) =>
                updateDraft(
                  'xMin',
                  value,
                )
              }
            />

            <CoordinateField
              label="max"
              value={draft.xMax}
              onChange={(value) =>
                updateDraft(
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
                updateDraft(
                  'yMin',
                  value,
                )
              }
            />

            <CoordinateField
              label="max"
              value={draft.yMax}
              onChange={(value) =>
                updateDraft(
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
                updateDraft(
                  'zMin',
                  value,
                )
              }
            />

            <CoordinateField
              label="max"
              value={draft.zMax}
              onChange={(value) =>
                updateDraft(
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
              onClick={() =>
                setOpen(false)
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="region-apply-button"
              onClick={apply}
            >
              Apply region
            </button>
          </div>
        </div>
      )}
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
        step="1"
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

export default RegionSelector
