import { useEffect, useMemo, useState } from 'react'
import './App.css'
import BrainViewer from './components/BrainViewer'

type ViewMode =
  | 'multi'
  | 'coronal'
  | 'sagittal'
  | 'axial'
  | 'render'

type Peak = {
  id: string
  studyId: string
  authors: string
  year: number | null
  title: string
  journal: string
  pmid: string

  peakSource: string
  nInContrast: string
  contrast: string
  groupsInContrast: string

  coordinateType: string
  originalAnatomicalLabel: string

  centralAim: string
  population: string
  patientGroup: string
  hemisphere: string

  xMni: number
  yMni: number
  zMni: number
}

type ReviewData = {
  numberOfCoordinates: number
  numberOfStudies: number
  peaks: Peak[]
}

type StudyPeak = {
  id: string
  x: number
  y: number
  z: number
  contrast: string
  groupsInContrast: string
  coordinateType: string
  anatomicalLabel: string
}

type StudySummary = {
  studyId: string
  authors: string
  year: number | null
  title: string
  journal: string
  pmid: string
  peakSources: string[]
  sampleSizes: string[]
  numberOfCoordinates: number
  peaks: StudyPeak[]
}

type FilterState = {
  centralAim: string
  peakSource: string
  population: string
  patientGroup: string
  hemisphere: string
  publicationYearMin: number | null
  publicationYearMax: number | null
}

type TextFilterKey =
  | 'centralAim'
  | 'peakSource'
  | 'population'
  | 'patientGroup'
  | 'hemisphere'

const emptyFilters: FilterState = {
  centralAim: '',
  peakSource: '',
  population: '',
  patientGroup: '',
  hemisphere: '',
  publicationYearMin: null,
  publicationYearMax: null,
}

function App() {
  const [coords, setCoords] =
    useState<[number, number, number]>([0, 0, 0])

  const [reviewData, setReviewData] =
    useState<ReviewData | null>(null)

  const [selectedStudyId, setSelectedStudyId] =
    useState<string | null>(null)

  const [focusCoordinate, setFocusCoordinate] =
    useState<[number, number, number] | null>(null)

  const [viewMode, setViewMode] =
    useState<ViewMode>('multi')

  const [filters, setFilters] =
    useState<FilterState>(emptyFilters)

  useEffect(() => {
    fetch('/data/peaks-mni.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not load review data')
        }

        return response.json()
      })
      .then((data: ReviewData) => {
        setReviewData(data)
      })
      .catch((error) => {
        console.error(
          'Failed to load review data:',
          error,
        )
      })
  }, [])

  const yearBounds = useMemo(() => {
    const years =
      reviewData?.peaks
        .map((peak) => peak.year)
        .filter(
          (year): year is number =>
            year !== null &&
            Number.isFinite(year),
        ) ?? []

    if (years.length === 0) {
      return {
        min: 2000,
        max: 2000,
      }
    }

    return {
      min: Math.min(...years),
      max: Math.max(...years),
    }
  }, [reviewData])

  const activeYearMin =
    filters.publicationYearMin ??
    yearBounds.min

  const activeYearMax =
    filters.publicationYearMax ??
    yearBounds.max

  const filterOptions = useMemo(() => {
    const peaks =
      reviewData?.peaks ?? []

    return {
      centralAim: uniqueText(
        peaks.map(
          (peak) => peak.centralAim,
        ),
      ),

      peakSource: uniqueText(
        peaks.map(
          (peak) => peak.peakSource,
        ),
      ),

      population: uniqueText(
        peaks.map(
          (peak) => peak.population,
        ),
      ),

      patientGroup: uniqueText(
        peaks.map(
          (peak) => peak.patientGroup,
        ),
      ),

      hemisphere: uniqueText(
        peaks.map(
          (peak) => peak.hemisphere,
        ),
      ),
    }
  }, [reviewData])

  const filteredPeaks = useMemo(() => {
    if (!reviewData) {
      return []
    }

    return reviewData.peaks.filter(
      (peak) => {
        if (
          filters.centralAim &&
          peak.centralAim !==
            filters.centralAim
        ) {
          return false
        }

        if (
          filters.peakSource &&
          peak.peakSource !==
            filters.peakSource
        ) {
          return false
        }

        if (
          filters.population &&
          peak.population !==
            filters.population
        ) {
          return false
        }

        if (
          filters.patientGroup &&
          peak.patientGroup !==
            filters.patientGroup
        ) {
          return false
        }

        if (
          filters.hemisphere &&
          peak.hemisphere !==
            filters.hemisphere
        ) {
          return false
        }

        if (
          peak.year !== null &&
          (
            peak.year < activeYearMin ||
            peak.year > activeYearMax
          )
        ) {
          return false
        }

        return true
      },
    )
  }, [
    reviewData,
    filters,
    activeYearMin,
    activeYearMax,
  ])

  const visiblePeakIds =
    useMemo(
      () =>
        filteredPeaks.map(
          (peak) => peak.id,
        ),
      [filteredPeaks],
    )

  const studies =
    useMemo<StudySummary[]>(() => {
      const studyMap =
        new Map<
          string,
          StudySummary
        >()

      for (
        const peak of filteredPeaks
      ) {
        const studyPeak:
          StudyPeak = {
          id: peak.id,

          x: peak.xMni,
          y: peak.yMni,
          z: peak.zMni,

          contrast:
            peak.contrast,

          groupsInContrast:
            peak.groupsInContrast,

          coordinateType:
            peak.coordinateType,

          anatomicalLabel:
            peak.originalAnatomicalLabel,
        }

        const existing =
          studyMap.get(
            peak.studyId,
          )

        if (existing) {
          existing.numberOfCoordinates +=
            1

          existing.peaks.push(
            studyPeak,
          )

          addUnique(
            existing.peakSources,
            peak.peakSource,
          )

          addUnique(
            existing.sampleSizes,
            cleanSampleSize(
              peak.nInContrast,
            ),
          )

          continue
        }

        const cleanedSampleSize =
          cleanSampleSize(
            peak.nInContrast,
          )

        studyMap.set(
          peak.studyId,
          {
            studyId:
              peak.studyId,

            authors:
              peak.authors,

            year:
              peak.year,

            title:
              peak.title,

            journal:
              peak.journal,

            pmid:
              peak.pmid,

            peakSources:
              usable(
                peak.peakSource,
              )
                ? [
                    peak.peakSource,
                  ]
                : [],

            sampleSizes:
              usable(
                cleanedSampleSize,
              )
                ? [
                    cleanedSampleSize,
                  ]
                : [],

            numberOfCoordinates:
              1,

            peaks: [
              studyPeak,
            ],
          },
        )
      }

      return Array.from(
        studyMap.values(),
      ).sort(
        (a, b) => {
          if (
            a.year !==
            b.year
          ) {
            return (
              (a.year ??
                9999) -
              (b.year ??
                9999)
            )
          }

          return a.authors.localeCompare(
            b.authors,
          )
        },
      )
    }, [filteredPeaks])

  const numberOfVisibleStudies =
    useMemo(
      () =>
        new Set(
          filteredPeaks.map(
            (peak) =>
              peak.studyId,
          ),
        ).size,
      [filteredPeaks],
    )

  const visibleStudies =
    studies.slice(0, 4)

  useEffect(() => {
    if (!selectedStudyId) {
      return
    }

    const stillVisible =
      filteredPeaks.some(
        (peak) =>
          peak.studyId ===
          selectedStudyId,
      )

    if (!stillVisible) {
      setSelectedStudyId(null)
      setFocusCoordinate(null)
    }
  }, [
    filteredPeaks,
    selectedStudyId,
  ])

  function updateFilter(
    key: TextFilterKey,
    value: string,
  ) {
    setFilters(
      (current) => ({
        ...current,
        [key]: value,
      }),
    )

    setFocusCoordinate(null)
  }

  function updateYearRange(
    min: number,
    max: number,
  ) {
    setFilters(
      (current) => ({
        ...current,
        publicationYearMin: min,
        publicationYearMax: max,
      }),
    )

    setFocusCoordinate(null)
  }

  function resetFilters() {
    setFilters(emptyFilters)
    setSelectedStudyId(null)
    setFocusCoordinate(null)
  }

  function selectStudy(
    studyId: string,
  ) {
    if (
      selectedStudyId ===
      studyId
    ) {
      setSelectedStudyId(
        null,
      )

      setFocusCoordinate(
        null,
      )

      return
    }

    setSelectedStudyId(
      studyId,
    )

    setFocusCoordinate(
      null,
    )
  }

  function selectPeak(
    studyId: string,
    coordinate:
      [number, number, number],
  ) {
    setSelectedStudyId(
      studyId,
    )

    setFocusCoordinate([
      coordinate[0],
      coordinate[1],
      coordinate[2],
    ])
  }

  return (
    <div className="app">
      <header className="site-header">
        <div>
          <div className="eyebrow">
            SYSTEMATIC REVIEW COMPANION
          </div>

          <h1>
            Claustrum Coordinates
          </h1>

          <p>
            Reported locations from
            the human neuroimaging
            literature
          </p>
        </div>

        <div className="header-actions">
          <button className="button secondary">
            About
          </button>

          <button className="button primary">
            Download data
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="filters">
          <div className="filters-header">
            <h2>
              Filters
            </h2>

            <button
              className="reset-button"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>

          <Filter
            label="Central aim"
            value={
              filters.centralAim
            }
            allLabel="All aims"
            options={
              filterOptions.centralAim
            }
            onChange={(value) =>
              updateFilter(
                'centralAim',
                value,
              )
            }
          />

          <Filter
            label="Peak source / modality"
            value={
              filters.peakSource
            }
            allLabel="All modalities"
            options={
              filterOptions.peakSource
            }
            onChange={(value) =>
              updateFilter(
                'peakSource',
                value,
              )
            }
          />

          <Filter
            label="Population"
            value={
              filters.population
            }
            allLabel="All populations"
            options={
              filterOptions.population
            }
            onChange={(value) =>
              updateFilter(
                'population',
                value,
              )
            }
          />

          <Filter
            label="Patient group"
            value={
              filters.patientGroup
            }
            allLabel="All groups"
            options={
              filterOptions.patientGroup
            }
            onChange={(value) =>
              updateFilter(
                'patientGroup',
                value,
              )
            }
          />

          <Filter
            label="Hemisphere"
            value={
              filters.hemisphere
            }
            allLabel="Left + Right"
            options={
              filterOptions.hemisphere
            }
            onChange={(value) =>
              updateFilter(
                'hemisphere',
                value,
              )
            }
          />

          <YearRangeFilter
            min={yearBounds.min}
            max={yearBounds.max}
            valueMin={activeYearMin}
            valueMax={activeYearMax}
            onChange={updateYearRange}
          />
        </aside>

        <section className="viewer-section">
          <div className="viewer-toolbar">
            <div className="viewer-stats">
              <strong>
                {filteredPeaks.length}
              </strong>
              {' '}coordinates
              <span> · </span>
              <strong>
                {numberOfVisibleStudies}
              </strong>
              {' '}studies
            </div>

            <div className="segmented">
              <button className="active">
                Points
              </button>

              <button>
                Study-weighted density
              </button>
            </div>
          </div>

          <div className="view-mode-bar">
            <button
              className={
                viewMode ===
                'multi'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setViewMode(
                  'multi',
                )
              }
            >
              4 views
            </button>

            <button
              className={
                viewMode ===
                'coronal'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setViewMode(
                  'coronal',
                )
              }
            >
              Coronal
            </button>

            <button
              className={
                viewMode ===
                'sagittal'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setViewMode(
                  'sagittal',
                )
              }
            >
              Sagittal
            </button>

            <button
              className={
                viewMode ===
                'axial'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setViewMode(
                  'axial',
                )
              }
            >
              Axial
            </button>

            <button
              className={
                viewMode ===
                'render'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setViewMode(
                  'render',
                )
              }
            >
              3D
            </button>
          </div>

          <div className="viewer">
            <BrainViewer
              onLocationChange={
                setCoords
              }

              selectedStudyId={
                selectedStudyId
              }

              focusCoordinate={
                focusCoordinate
              }

              viewMode={
                viewMode
              }

              visiblePeakIds={
                visiblePeakIds
              }
            />

            <div className="viewer-footer">
              <div className="coordinate-readout">
                <span className="coordinate-label">
                  MNI
                </span>

                <span className="coord-pill">
                  x{' '}
                  {coords[0].toFixed(
                    1,
                  )}
                </span>

                <span className="coord-pill">
                  y{' '}
                  {coords[1].toFixed(
                    1,
                  )}
                </span>

                <span className="coord-pill">
                  z{' '}
                  {coords[2].toFixed(
                    1,
                  )}
                </span>
              </div>

              <button className="button small">
                Select 3D region
              </button>
            </div>
          </div>
        </section>

        <aside className="studies">
          <div className="studies-header">
            <h2>
              Studies
            </h2>

            <p>
              {numberOfVisibleStudies}{' '}
              currently visible
            </p>
          </div>

          {visibleStudies.map(
            (study) => (
              <StudyCard
                key={
                  study.studyId
                }

                study={
                  study
                }

                selected={
                  selectedStudyId ===
                  study.studyId
                }

                onSelect={() =>
                  selectStudy(
                    study.studyId,
                  )
                }

                onPeakSelect={(
                  coordinate,
                ) =>
                  selectPeak(
                    study.studyId,
                    coordinate,
                  )
                }
              />
            ),
          )}

          {studies.length === 0 && (
            <div className="no-results">
              No studies match these filters.
            </div>
          )}

          {studies.length >
            visibleStudies.length && (
            <button className="view-all-button">
              Browse all{' '}
              {studies.length}{' '}
              studies
            </button>
          )}
        </aside>
      </main>

      <div className="selection-bar">
        <div>
          <strong>
            Current selection
          </strong>

          <span>
            {filteredPeaks.length}{' '}
            coordinates from{' '}
            {numberOfVisibleStudies}{' '}
            studies
          </span>
        </div>

        <div className="selection-actions">
          <button className="button secondary">
            Enter bounding coordinates
          </button>

          <button className="button primary">
            Download selection CSV
          </button>
        </div>
      </div>
    </div>
  )
}

function usable(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return false
  }

  const cleaned =
    value
      .trim()
      .toUpperCase()

  return (
    cleaned !== '' &&
    cleaned !== 'NA' &&
    cleaned !== 'NR'
  )
}

function uniqueText(
  values: string[],
) {
  return Array.from(
    new Set(
      values.filter(
        usable,
      ),
    ),
  ).sort(
    (a, b) =>
      a.localeCompare(b),
  )
}

function addUnique(
  array: string[],
  value: string,
) {
  if (!usable(value)) {
    return
  }

  if (
    !array.includes(value)
  ) {
    array.push(value)
  }
}

function cleanSampleSize(
  value:
    | string
    | null
    | undefined,
) {
  if (!usable(value)) {
    return ''
  }

  return String(value)
    .trim()
    .replace(
      /^n\s*=\s*/i,
      '',
    )
}

function abbreviatedAuthors(
  authors: string,
) {
  if (!authors) {
    return 'Unknown authors'
  }

  if (
    authors
      .toLowerCase()
      .includes('et al')
  ) {
    return authors
  }

  const firstAuthor =
    authors
      .split(';')[0]
      .trim()

  if (!firstAuthor) {
    return authors
  }

  const surname =
    firstAuthor
      .split(/\s+/)[0]

  return `${surname} et al.`
}

function sampleSizeLabel(
  study: StudySummary,
) {
  if (
    study.sampleSizes.length ===
    0
  ) {
    return null
  }

  if (
    study.sampleSizes.length ===
    1
  ) {
    return `n = ${study.sampleSizes[0]}`
  }

  return `n = ${study.sampleSizes.join(
    ', ',
  )}`
}

function formatCoordinate(
  value: number,
) {
  if (
    Number.isInteger(value)
  ) {
    return String(value)
  }

  return value.toFixed(1)
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
  return (
    <label className="filter-group">
      <span>
        {label}
      </span>

      <select
        value={value}

        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
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

type StudyCardProps = {
  study: StudySummary
  selected: boolean
  onSelect: () => void

  onPeakSelect: (
    coordinate:
      [number, number, number],
  ) => void
}

function StudyCard({
  study,
  selected,
  onSelect,
  onPeakSelect,
}: StudyCardProps) {
  const source =
    study.peakSources.length >
    0
      ? study.peakSources.join(
          ' + ',
        )
      : 'Reported coordinates'

  const coordinateLabel =
    study.numberOfCoordinates ===
    1
      ? '1 coordinate'
      : `${study.numberOfCoordinates} coordinates`

  const sampleSize =
    sampleSizeLabel(study)

  const contrasts =
    Array.from(
      new Set(
        study.peaks
          .map(
            (peak) =>
              peak.contrast,
          )
          .filter(
            usable,
          ),
      ),
    )

  return (
    <div
      className={
        selected
          ? 'study-card selected'
          : 'study-card'
      }

      title={
        study.title
      }

      onClick={
        onSelect
      }
    >
      <div className="study-card-top">
        <strong>
          {abbreviatedAuthors(
            study.authors,
          )}
        </strong>

        <span className="study-year">
          {study.year ?? ''}
        </span>
      </div>

      {usable(
        study.pmid,
      ) && (
        <a
          className="pubmed-link"

          href={`https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(
            study.pmid,
          )}/`}

          target="_blank"

          rel="noreferrer"

          onClick={(
            event,
          ) =>
            event.stopPropagation()
          }
        >
          PMID{' '}
          {study.pmid}
        </a>
      )}

      <div className="study-modality">
        {source}
        {' · '}
        {coordinateLabel}
      </div>

      {selected && (
        <div
          className="study-expanded"

          onClick={(
            event,
          ) =>
            event.stopPropagation()
          }
        >
          <div className="study-expanded-title">
            {study.title}
          </div>

          {usable(
            study.journal,
          ) && (
            <div className="study-journal">
              {study.journal}
            </div>
          )}

          {sampleSize && (
            <div className="study-detail-row">
              <span className="study-detail-label">
                Sample
              </span>

              <span>
                {sampleSize}
              </span>
            </div>
          )}

          {contrasts.length >
            0 && (
            <div className="study-detail-row">
              <span className="study-detail-label">
                Contrast
              </span>

              <span>
                {contrasts.join(
                  '; ',
                )}
              </span>
            </div>
          )}

          <div className="study-peaks-heading">
            Reported peaks
          </div>

          <div className="study-peak-list">
            {study.peaks.map(
              (
                peak,
                index,
              ) => {
                const peakMeta =
                  [
                    peak.coordinateType,
                    peak.anatomicalLabel,
                  ]
                    .filter(
                      usable,
                    )
                    .join(
                      ' · ',
                    )

                return (
                  <button
                    key={
                      peak.id
                    }

                    type="button"

                    className="study-peak-button"

                    onClick={() =>
                      onPeakSelect(
                        [
                          peak.x,
                          peak.y,
                          peak.z,
                        ],
                      )
                    }
                  >
                    <span className="study-peak-number">
                      {index +
                        1}
                    </span>

                    <span className="study-peak-content">
                      <span className="study-peak-coordinate">
                        (
                        {formatCoordinate(
                          peak.x,
                        )}
                        ,{' '}
                        {formatCoordinate(
                          peak.y,
                        )}
                        ,{' '}
                        {formatCoordinate(
                          peak.z,
                        )}
                        )
                      </span>

                      {peakMeta && (
                        <span className="study-peak-meta">
                          {
                            peakMeta
                          }
                        </span>
                      )}
                    </span>
                  </button>
                )
              },
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App