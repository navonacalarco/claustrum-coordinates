import {
  useEffect,
  useRef,
} from 'react'

export type FilterState = {
  peakSource: string[]
  population: string[]
  patientCategory: string[]
  patientGroup: string[]
  hemisphere: string[]
  originalSpace: string[]
  publicationYearMin: number | null
  publicationYearMax: number | null
}

export type TextFilterKey =
  | 'peakSource'
  | 'population'
  | 'patientCategory'
  | 'patientGroup'
  | 'hemisphere'
  | 'originalSpace'

type FilterOptions = {
  peakSource: string[]
  population: string[]
  patientCategory: string[]
  patientGroup: string[]
  hemisphere: string[]
  originalSpace: string[]
}

type FiltersPanelProps = {
  filters: FilterState
  filterOptions: FilterOptions
  yearMin: number
  yearMax: number
  activeYearMin: number
  activeYearMax: number
  patientGroupDisabled: boolean

  onFilterChange: (
    key: TextFilterKey,
    value: string[],
  ) => void

  onYearRangeChange: (
    min: number,
    max: number,
  ) => void

  onReset: () => void
}

function FiltersPanel({
  filters,
  filterOptions,
  yearMin,
  yearMax,
  activeYearMin,
  activeYearMax,
  patientGroupDisabled,
  onFilterChange,
  onYearRangeChange,
  onReset,
}: FiltersPanelProps) {
  return (
    <aside className="filters">
      <div className="filters-header">
        <h2>
          Filters
        </h2>

        <button
          className="reset-button"
          onClick={onReset}
        >
          Reset
        </button>
      </div>

      <MultiSelectFilter
        label="Peak source / modality"
        value={filters.peakSource}
        allLabel="All modalities"
        options={filterOptions.peakSource}
        onChange={(value) =>
          onFilterChange(
            'peakSource',
            value,
          )
        }
      />

      <MultiSelectFilter
        label="Population"
        value={filters.population}
        allLabel="All populations"
        options={filterOptions.population}
        onChange={(value) =>
          onFilterChange(
            'population',
            value,
          )
        }
      />

      <MultiSelectFilter
        label="Patient category"
        value={filters.patientCategory}
        allLabel="All categories"
        options={filterOptions.patientCategory}
        disabled={patientGroupDisabled}
        disabledText="Not applicable to healthy-control-only studies"
        onChange={(value) => onFilterChange('patientCategory', value)}
      />

      <MultiSelectFilter
        label="Patient group"
        value={filters.patientGroup}
        allLabel={filters.patientCategory.length ? "All groups in selected categories" : "All groups"}
        options={filterOptions.patientGroup}
        disabled={patientGroupDisabled}
        disabledText="Not applicable to healthy-control-only studies"
        onChange={(value) =>
          onFilterChange(
            'patientGroup',
            value,
          )
        }
      />

      <MultiSelectFilter
        label="Hemisphere"
        value={filters.hemisphere}
        allLabel="Left + Right"
        options={filterOptions.hemisphere}
        onChange={(value) =>
          onFilterChange(
            'hemisphere',
            value,
          )
        }
      />

      <MultiSelectFilter
        label="Original space"
        value={filters.originalSpace}
        allLabel="MNI + Talairach"
        options={filterOptions.originalSpace}
        onChange={(value) =>
          onFilterChange(
            'originalSpace',
            value,
          )
        }
      />

      <YearRangeFilter
        min={yearMin}
        max={yearMax}
        valueMin={activeYearMin}
        valueMax={activeYearMax}
        onChange={onYearRangeChange}
      />
    </aside>
  )
}

type MultiSelectFilterProps = {
  label: string
  value: string[]
  allLabel: string
  options: string[]
  disabled?: boolean
  disabledText?: string

  onChange: (
    value: string[],
  ) => void
}

function MultiSelectFilter({
  label,
  value,
  allLabel,
  options,
  disabled = false,
  disabledText = 'Not applicable',
  onChange,
}: MultiSelectFilterProps) {
  const detailsRef =
    useRef<HTMLDetailsElement | null>(
      null,
    )

  useEffect(() => {
    function handlePointerDown(
      event: PointerEvent,
    ) {
      const details =
        detailsRef.current

      if (
        !details?.open ||
        !(event.target instanceof Node) ||
        details.contains(event.target)
      ) {
        return
      }

      details.open = false
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      const details =
        detailsRef.current

      if (
        event.key !== 'Escape' ||
        !details?.open
      ) {
        return
      }

      details.open = false

      details
        .querySelector('summary')
        ?.focus()
    }

    document.addEventListener(
      'pointerdown',
      handlePointerDown,
    )

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      )

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [])

  function toggleOption(
    option: string,
  ) {
    if (
      value.includes(option)
    ) {
      onChange(
        value.filter(
          (item) =>
            item !== option,
        ),
      )

      return
    }

    onChange([
      ...value,
      option,
    ])
  }

  const summary =
    multiSelectSummary(
      label,
      value,
      allLabel,
    )

  return (
    <div className="filter-group">
      <span>
        {label}
      </span>

      {disabled ? (
        <div
          className="multi-select-disabled"
          aria-disabled="true"
        >
          {disabledText}
        </div>
      ) : (
        <details
          ref={detailsRef}
          className="multi-select"
        >
          <summary>
            <span>
              {summary}
            </span>
          </summary>

          <div className="multi-select-menu">
            <button
              type="button"
              className={
                value.length === 0
                  ? 'multi-select-all active'
                  : 'multi-select-all'
              }
              onClick={() =>
                onChange([])
              }
            >
              <span
                className="multi-select-check"
                aria-hidden="true"
              >
                {value.length === 0
                  ? '✓'
                  : ''}
              </span>

              <span>
                {allLabel}
              </span>
            </button>

            <div className="multi-select-divider" />

            {options.map(
              (option) => {
                const checked =
                  value.includes(
                    option,
                  )

                return (
                  <label
                    key={option}
                    className="multi-select-option"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleOption(
                          option,
                        )
                      }
                    />

                    <span>
                      {friendlyFilterLabel(
                        label,
                        option,
                      )}
                    </span>
                  </label>
                )
              },
            )}
          </div>
        </details>
      )}
    </div>
  )
}

type YearRangeFilterProps = {
  min: number
  max: number
  valueMin: number
  valueMax: number

  onChange: (
    min: number,
    max: number,
  ) => void
}

function YearRangeFilter({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
}: YearRangeFilterProps) {
  const span =
    Math.max(
      1,
      max - min,
    )

  const leftPercent =
    ((valueMin - min) /
      span) *
    100

  const rightPercent =
    100 -
    ((valueMax - min) /
      span) *
      100

  return (
    <div className="filter-group year-filter">
      <span>
        Publication year
      </span>

      <div className="year-range-value">
        <span>
          {valueMin}
        </span>

        <span className="year-range-dash">
          –
        </span>

        <span>
          {valueMax}
        </span>
      </div>

      <div className="year-range-control">
        <div className="year-range-track" />

        <div
          className="year-range-selected"
          style={{
            left:
              `${leftPercent}%`,
            right:
              `${rightPercent}%`,
          }}
        />

        <input
          className="year-range-input year-range-min"
          type="range"
          min={min}
          max={max}
          step="1"
          value={valueMin}
          aria-label="Earliest publication year"
          onChange={(event) => {
            const next =
              Number(
                event.target.value,
              )

            onChange(
              Math.min(
                next,
                valueMax,
              ),
              valueMax,
            )
          }}
        />

        <input
          className="year-range-input year-range-max"
          type="range"
          min={min}
          max={max}
          step="1"
          value={valueMax}
          aria-label="Latest publication year"
          onChange={(event) => {
            const next =
              Number(
                event.target.value,
              )

            onChange(
              valueMin,
              Math.max(
                next,
                valueMin,
              ),
            )
          }}
        />
      </div>

      <div className="year-range-bounds">
        <span>
          {min}
        </span>

        <span>
          {max}
        </span>
      </div>
    </div>
  )
}

function multiSelectSummary(
  filterLabel: string,
  values: string[],
  allLabel: string,
) {
  if (values.length === 0) {
    return allLabel
  }

  if (values.length === 1) {
    return friendlyFilterLabel(
      filterLabel,
      values[0],
    )
  }

  return `${values.length} selected`
}

function friendlyFilterLabel(
  filterLabel: string,
  option: string,
) {
  if (
    filterLabel ===
    'Population'
  ) {
    const lower =
      option.toLowerCase()

    if (
      lower === 'hc'
    ) {
      return 'Healthy controls'
    }

    if (
      lower === 'both'
    ) {
      return 'Patients + controls'
    }

    if (
      lower === 'patients'
    ) {
      return 'Patients'
    }
  }

  return option
}

export default FiltersPanel
