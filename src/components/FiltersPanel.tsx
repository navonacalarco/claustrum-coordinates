import type { ChangeEvent } from 'react'

export type FilterState = {
  centralAim: string
  peakSource: string
  population: string
  patientGroup: string
  hemisphere: string
  publicationYearMin: number | null
  publicationYearMax: number | null
}

export type TextFilterKey =
  | 'centralAim'
  | 'peakSource'
  | 'population'
  | 'patientGroup'
  | 'hemisphere'

type FilterOptions = {
  centralAim: string[]
  peakSource: string[]
  population: string[]
  patientGroup: string[]
  hemisphere: string[]
}

type FiltersPanelProps = {
  filters: FilterState
  filterOptions: FilterOptions
  yearMin: number
  yearMax: number
  activeYearMin: number
  activeYearMax: number

  onFilterChange: (
    key: TextFilterKey,
    value: string,
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

      <Filter
        label="Central aim"
        value={filters.centralAim}
        allLabel="All aims"
        options={filterOptions.centralAim}
        onChange={(value) =>
          onFilterChange(
            'centralAim',
            value,
          )
        }
      />

      <Filter
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

      <Filter
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

      <Filter
        label="Patient group"
        value={filters.patientGroup}
        allLabel="All groups"
        options={filterOptions.patientGroup}
        onChange={(value) =>
          onFilterChange(
            'patientGroup',
            value,
          )
        }
      />

      <Filter
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

type FilterProps = {
  label: string
  value: string
  allLabel: string
  options: string[]

  onChange: (
    value: string,
  ) => void
}

function Filter({
  label,
  value,
  allLabel,
  options,
  onChange,
}: FilterProps) {
  function handleChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    onChange(
      event.target.value,
    )
  }

  return (
    <label className="filter-group">
      <span>
        {label}
      </span>

      <select
        value={value}
        onChange={handleChange}
      >
        <option value="">
          {allLabel}
        </option>

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {friendlyFilterLabel(
                label,
                option,
              )}
            </option>
          ),
        )}
      </select>
    </label>
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
