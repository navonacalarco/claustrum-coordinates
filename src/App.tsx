import { useEffect, useMemo, useState } from 'react'
import './App.css'
import BrainViewer from './components/BrainViewer'
import FiltersPanel, {
  type FilterState,
  type TextFilterKey,
} from './components/FiltersPanel'
import StudyCard, { type StudyPeak, type StudySummary } from './components/StudyCard'
import StudyBrowser from './components/StudyBrowser'

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

  const [selectedPeakId, setSelectedPeakId] =
    useState<string | null>(null)

  const [focusCoordinate, setFocusCoordinate] =
    useState<[number, number, number] | null>(null)

  const [viewMode, setViewMode] =
    useState<ViewMode>('multi')

  const [filters, setFilters] =
    useState<FilterState>(emptyFilters)

  const [studyBrowserOpen, setStudyBrowserOpen] =
    useState(false)

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

  /*
   * Apply the review filters at the
   * coordinate level.
   */
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

  /*
   * Convert the currently visible peaks
   * into study-level summaries.
   */
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
    studies.length

  const visibleStudies =
    studies.slice(0, 4)

  /*
   * If filtering removes the selected
   * study, clear the selection.
   */
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
      setSelectedPeakId(null)
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

    setSelectedPeakId(null)
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

    setSelectedPeakId(null)
    setFocusCoordinate(null)
  }

  function resetFilters() {
    setFilters(emptyFilters)
    setSelectedStudyId(null)
    setSelectedPeakId(null)
    setFocusCoordinate(null)
  }

  function clearSelection() {
    setSelectedStudyId(null)
    setSelectedPeakId(null)
    setFocusCoordinate(null)
  }

  function showAll() {
    clearSelection()
    setStudyBrowserOpen(false)
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

      setSelectedPeakId(
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

    setSelectedPeakId(
      null,
    )

    setFocusCoordinate(
      null,
    )
  }

  function selectPeak(
    studyId: string,
    peakId: string,
    coordinate:
      [number, number, number],
  ) {
    setSelectedStudyId(
      studyId,
    )

    setSelectedPeakId(
      peakId,
    )

    setFocusCoordinate([
      coordinate[0],
      coordinate[1],
      coordinate[2],
    ])
  }

  function handleBrainPeakClick(
    peakId: string,
    studyId: string,
    coordinate:
      [number, number, number],
  ) {
    setSelectedStudyId(
      studyId,
    )

    setSelectedPeakId(
      peakId,
    )

    setFocusCoordinate([
      coordinate[0],
      coordinate[1],
      coordinate[2],
    ])

    setStudyBrowserOpen(true)
  }

  function openStudyBrowser() {
    setStudyBrowserOpen(true)
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
        <FiltersPanel
          filters={filters}
          filterOptions={filterOptions}
          yearMin={yearBounds.min}
          yearMax={yearBounds.max}
          activeYearMin={activeYearMin}
          activeYearMax={activeYearMax}
          onFilterChange={updateFilter}
          onYearRangeChange={updateYearRange}
          onReset={resetFilters}
        />

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

              onPeakClick={
                handleBrainPeakClick
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

            {selectedStudyId ? (
              <button
                type="button"
                className="show-all-button"
                onClick={showAll}
              >
                Show all
              </button>
            ) : (
              studies.length >
                visibleStudies.length && (
                <button
                  type="button"
                  className="browse-studies-button"
                  onClick={openStudyBrowser}
                >
                  Browse all {studies.length}
                  <span aria-hidden="true">
                    →
                  </span>
                </button>
              )
            )}
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

                selectedPeakId={
                  selectedPeakId
                }

                onSelect={() =>
                  selectStudy(
                    study.studyId,
                  )
                }

                onPeakSelect={(
                  peakId,
                  coordinate,
                ) =>
                  selectPeak(
                    study.studyId,
                    peakId,
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

      {studyBrowserOpen && (
        <StudyBrowser
          studies={studies}
          selectedStudyId={selectedStudyId}
          selectedPeakId={selectedPeakId}
          onClose={() => setStudyBrowserOpen(false)}
          onShowAll={showAll}
          onStudySelect={selectStudy}
          onPeakSelect={selectPeak}
        />
      )}
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

export default App
