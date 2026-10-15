import { useEffect, useMemo, useState } from 'react'
import type { Niivue } from '@niivue/niivue'
import AtlasOverlayControl from './components/AtlasOverlayControl'
import './App.css'
import { patientCategories, matchesPatientCategory, patientGroupOptions, retainPatientGroups } from './components/patientFilters'
import BrainViewer from './components/BrainViewer'
import AboutModal from './components/AboutModal'
import CoordinateNavigator from './components/CoordinateNavigator'
import DownloadMenu from './components/DownloadMenu'
import FiltersPanel, {
  type FilterState,
  type TextFilterKey,
} from './components/FiltersPanel'
import { type StudyPeak, type StudySummary } from './components/StudyCard'
import StudiesPanel from './components/StudiesPanel'
import RegionSelector, {
  type RegionBounds,
} from './components/RegionSelector'

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

  xOriginal: number | null
  yOriginal: number | null
  zOriginal: number | null
  originalSpace: string
  transformation: string

  centralAim: string
  population: string
  patientCategory: string
  patientGroup: string
  hemisphere: string

  xMni: number
  yMni: number
  zMni: number

  [key: string]: unknown
}

type ReviewData = {
  numberOfCoordinates: number
  numberOfStudies: number
  peaks: Peak[]
}

const emptyFilters: FilterState = {
  peakSource: [],
  population: [],
  patientCategory: [],
  patientGroup: [],
  hemisphere: [],
  originalSpace: [],
  publicationYearMin: null,
  publicationYearMax: null,
}

function App() {
  const [atlasViewer, setAtlasViewer] = useState<Niivue | null>(null)

  const [coords, setCoords] =
    useState<[number, number, number]>([0, 0, 0])

  const [
    coordinateNavigationRequest,
    setCoordinateNavigationRequest,
  ] = useState<{
    coordinate: [
      number,
      number,
      number,
    ]
    requestId: number
  } | null>(null)

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

  const [regionBounds, setRegionBounds] =
    useState<RegionBounds | null>(null)

  const [
    draftRegionBounds,
    setDraftRegionBounds,
  ] = useState<RegionBounds | null>(null)

  const [regionDrawing, setRegionDrawing] =
    useState(false)

  const [aboutOpen, setAboutOpen] =
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

      patientCategory: uniqueText(
        peaks.flatMap((peak) => patientCategories(peak.patientCategory)),
      ),

      patientGroup: patientGroupOptions(peaks, filters.patientCategory),

      hemisphere: uniqueText(
        peaks.map(
          (peak) => peak.hemisphere,
        ),
      ),

      originalSpace: uniqueText(
        peaks.map(
          (peak) =>
            canonicalOriginalSpace(
              peak.originalSpace,
            ),
        ),
      ),
    }
  }, [reviewData, filters.patientCategory])

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
          filters.peakSource.length > 0 &&
          !filters.peakSource.includes(
            peak.peakSource,
          )
        ) {
          return false
        }

        if (
          filters.population.length > 0 &&
          !filters.population.includes(
            peak.population,
          )
        ) {
          return false
        }

        if (!matchesPatientCategory(peak, filters.patientCategory)) {
          return false
        }

        if (
          filters.patientGroup.length > 0 &&
          !filters.patientGroup.includes(
            peak.patientGroup,
          )
        ) {
          return false
        }

        if (
          filters.hemisphere.length > 0 &&
          !filters.hemisphere.includes(
            peak.hemisphere,
          )
        ) {
          return false
        }

        if (
          filters.originalSpace.length > 0 &&
          !filters.originalSpace.includes(
            canonicalOriginalSpace(
              peak.originalSpace,
            ),
          )
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

  const regionDisplayBounds =
    regionDrawing
      ? draftRegionBounds
      : regionBounds

  /*
   * Spatial selection is intentionally layered
   * on top of the review filters.
   */
  const displayedPeaks =
    useMemo(() => {
      if (!regionBounds) {
        return filteredPeaks
      }

      return filteredPeaks.filter(
        (peak) =>
          peak.xMni >= regionBounds.xMin &&
          peak.xMni <= regionBounds.xMax &&
          peak.yMni >= regionBounds.yMin &&
          peak.yMni <= regionBounds.yMax &&
          peak.zMni >= regionBounds.zMin &&
          peak.zMni <= regionBounds.zMax,
      )
    }, [
      filteredPeaks,
      regionBounds,
    ])

  const visiblePeakIds =
    useMemo(
      () =>
        displayedPeaks.map(
          (peak) => peak.id,
        ),
      [displayedPeaks],
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
        const peak of displayedPeaks
      ) {
        const studyPeak:
          StudyPeak = {
          id: peak.id,

          x: peak.xMni,
          y: peak.yMni,
          z: peak.zMni,

          xOriginal:
            numericOrNull(
              peak.xOriginal,
            ),

          yOriginal:
            numericOrNull(
              peak.yOriginal,
            ),

          zOriginal:
            numericOrNull(
              peak.zOriginal,
            ),

          originalSpace:
            canonicalOriginalSpace(
              peak.originalSpace,
            ),

          transformation:
            peak.transformation,

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
            existing.patientGroups,
            peak.patientGroup,
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

            patientGroups:
              usable(
                peak.patientGroup,
              )
                ? [
                    peak.patientGroup,
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
    }, [displayedPeaks])

  const healthyControlsOnly =
    filters.population.length === 1 &&
    isHealthyControlsValue(
      filters.population[0],
    )

  const hasActiveFilters =
    filters.peakSource.length > 0 ||
    filters.population.length > 0 ||
    filters.patientCategory.length > 0 ||
    filters.patientGroup.length > 0 ||
    filters.hemisphere.length > 0 ||
    filters.originalSpace.length > 0 ||
    activeYearMin !== yearBounds.min ||
    activeYearMax !== yearBounds.max ||
    regionBounds !== null

  /*
   * If filtering removes the selected
   * study, clear the selection.
   */
  useEffect(() => {
    if (!selectedStudyId) {
      return
    }

    const stillVisible =
      displayedPeaks.some(
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
    displayedPeaks,
    selectedStudyId,
  ])

  function updateFilter(
    key: TextFilterKey,
    value: string[],
  ) {
    setFilters(
      (current) => {
        const next = {
          ...current,
          [key]: value,
        }

        if (
          key === 'population' &&
          value.length === 1 &&
          isHealthyControlsValue(
            value[0],
          )
        ) {
          next.patientCategory = []
          next.patientGroup = []
        }

        if (key === 'patientCategory') {
          next.patientGroup = retainPatientGroups(
            reviewData?.peaks ?? [], value, current.patientGroup,
          )
        }

        return next
      },
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
  }

  function navigateToCoordinate(
    coordinate:
      [number, number, number],
  ) {
    setCoordinateNavigationRequest(
      (current) => ({
        coordinate: [
          coordinate[0],
          coordinate[1],
          coordinate[2],
        ],
        requestId:
          (current?.requestId ??
            0) + 1,
      }),
    )
  }

  function startRegionDrawing() {
    setDraftRegionBounds(
      regionBounds
        ? { ...regionBounds }
        : null,
    )

    setRegionDrawing(true)

    // Region drawing is easiest to understand
    // with all three orthogonal views visible.
    setViewMode('multi')

    setSelectedStudyId(null)
    setSelectedPeakId(null)
    setFocusCoordinate(null)
  }

  function updateDraftRegion(
    bounds: RegionBounds,
  ) {
    setDraftRegionBounds(bounds)
  }

  function applyDrawnRegion() {
    if (!draftRegionBounds) {
      return
    }

    setRegionBounds({
      ...draftRegionBounds,
    })

    setRegionDrawing(false)

    setSelectedStudyId(null)
    setSelectedPeakId(null)
    setFocusCoordinate(null)
  }

  function cancelRegionDrawing() {
    setDraftRegionBounds(
      regionBounds
        ? { ...regionBounds }
        : null,
    )

    setRegionDrawing(false)
  }

  function clearRegion() {
    setRegionBounds(null)
    setDraftRegionBounds(null)
    setRegionDrawing(false)
    setSelectedStudyId(null)
    setSelectedPeakId(null)
    setFocusCoordinate(null)
  }

  function downloadAllData() {
    if (
      !reviewData ||
      reviewData.peaks.length === 0
    ) {
      return
    }

    downloadPeaksCsv(
      reviewData.peaks,
      'claustrum-coordinates.csv',
    )
  }

  function downloadCurrentSelection() {
    if (
      displayedPeaks.length === 0
    ) {
      return
    }

    downloadPeaksCsv(
      displayedPeaks,
      'claustrum-coordinates-selection.csv',
    )
  }

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-brand">
          <div className="eyebrow">
            SYSTEMATIC REVIEW COMPANION
          </div>

          <h1>
            Claustrum Coordinates
          </h1>

          <p className="site-subtitle">
            A comprehensive map of reported claustrum locations across the human MRI literature.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              setAboutOpen(true)
            }
          >
            About
          </button>

          <DownloadMenu
            showCurrentSelection={
              hasActiveFilters &&
              displayedPeaks.length > 0
            }
            onDownloadAll={
              downloadAllData
            }
            onDownloadCurrent={
              downloadCurrentSelection
            }
          />
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
          patientGroupDisabled={
            healthyControlsOnly
          }
          onFilterChange={updateFilter}
          onYearRangeChange={updateYearRange}
          onReset={resetFilters}
        />

        <section className="viewer-section">
          <div className="viewer">
            <BrainViewer
              onViewerReady={setAtlasViewer}
              onLocationChange={
                setCoords
              }

              selectedStudyId={
                selectedStudyId
              }

              focusCoordinate={
                focusCoordinate
              }

              navigationRequest={
                coordinateNavigationRequest
              }

              viewMode={
                viewMode
              }

              onViewModeChange={
                setViewMode
              }

              regionDrawing={
                regionDrawing
              }

              regionBounds={
                regionDisplayBounds
              }

              onRegionBoundsChange={
                updateDraftRegion
              }

              visiblePeakIds={
                visiblePeakIds
              }

              onPeakClick={
                handleBrainPeakClick
              }
            />

            <div className="viewer-footer">
              <CoordinateNavigator
                coords={coords}
                onNavigate={
                  navigateToCoordinate
                }
              />

              <div className="viewer-footer-actions">
                <AtlasOverlayControl viewer={atlasViewer} />
                <RegionSelector
                  bounds={regionBounds}
                  draftBounds={
                    draftRegionBounds
                  }
                  drawing={
                    regionDrawing
                  }
                  onStartDrawing={
                    startRegionDrawing
                  }
                  onDraftChange={
                    updateDraftRegion
                  }
                  onApplyDrawing={
                    applyDrawnRegion
                  }
                  onCancelDrawing={
                    cancelRegionDrawing
                  }
                  onClear={clearRegion}
                />
              </div>
            </div>
          </div>
        </section>

        <StudiesPanel
          studies={studies}
          filtered={hasActiveFilters}
          numberOfCoordinates={displayedPeaks.length}
          selectedStudyId={selectedStudyId}
          selectedPeakId={selectedPeakId}
          onShowAll={clearSelection}
          onStudySelect={selectStudy}
          onPeakSelect={selectPeak}
        />
      </main>

      <AboutModal
        open={aboutOpen}
        numberOfCoordinates={
          reviewData?.numberOfCoordinates ??
          null
        }
        numberOfStudies={
          reviewData?.numberOfStudies ??
          null
        }
        onClose={() =>
          setAboutOpen(false)
        }
      />
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

function downloadPeaksCsv(
  peaks: Peak[],
  filename: string,
) {
  if (peaks.length === 0) {
    return
  }

  const availableColumns =
    Array.from(
      new Set(
        peaks.flatMap(
          (peak) =>
            Object.keys(peak),
        ),
      ),
    )

  const preferredColumns = [
    'authors',
    'year',
    'title',
    'journal',
    'pmid',
    'doi',
    'studyId',
    'id',
    'peakSource',
    'mapType',
    'coordinateType',
    'hemisphere',
    'xMni',
    'yMni',
    'zMni',
    'xOriginal',
    'yOriginal',
    'zOriginal',
    'originalSpace',
    'transformation',
    'originalAnatomicalLabel',
    'otherLabelsInCluster',
    'contrast',
    'groupsInContrast',
    'nInContrast',
    'direction',
    'centralAim',
    'population',
    'patientCategory',
    'patientGroup',
    'fieldStrength',
    'modalities',
    'software',
    'labellingMethod',
    'searchSpace',
    'smoothingFwhm',
    'correctionMethod',
    'sourceInPaper',
    'notes',
  ]

  const columns = [
    ...preferredColumns.filter(
      (column) =>
        availableColumns.includes(
          column,
        ),
    ),
    ...availableColumns.filter(
      (column) =>
        !preferredColumns.includes(
          column,
        ),
    ),
  ]

  const rows = [
    columns
      .map(csvEscape)
      .join(','),
    ...peaks.map(
      (peak) =>
        columns
          .map(
            (column) =>
              csvEscape(
                peak[column],
              ),
          )
          .join(','),
    ),
  ]

  const blob =
    new Blob(
      [
        '\ufeff',
        rows.join('\n'),
      ],
      {
        type:
          'text/csv;charset=utf-8',
      },
    )

  const url =
    URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

function csvEscape(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  const text =
    typeof value === 'object'
      ? JSON.stringify(value)
      : String(value)

  if (
    text.includes(',') ||
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r')
  ) {
    return `"${text.replace(
      /"/g,
      '""',
    )}"`
  }

  return text
}

function numericOrNull(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  const number =
    Number(value)

  return Number.isFinite(
    number,
  )
    ? number
    : null
}

function canonicalOriginalSpace(
  value: string,
) {
  const normalized =
    value
      .trim()
      .toLowerCase()

  if (
    normalized.includes(
      'tal',
    )
  ) {
    return 'Talairach'
  }

  if (
    normalized.includes(
      'mni',
    )
  ) {
    return 'MNI'
  }

  return value.trim()
}

function isHealthyControlsValue(
  value: string,
) {
  const normalized = value
    .trim()
    .toLowerCase()

  return (
    normalized === 'hc' ||
    normalized === 'hc only' ||
    normalized === 'healthy controls' ||
    normalized === 'healthy controls only'
  )
}

export default App

