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
  pmid: string
  peakSource: string
  nInContrast: string
  contrast: string
  groupsInContrast: string
  coordinateType: string
  originalAnatomicalLabel: string
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
  pmid: string
  peakSources: string[]
  sampleSizes: string[]
  numberOfCoordinates: number
  peaks: StudyPeak[]
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

  const studies = useMemo<StudySummary[]>(() => {
    if (!reviewData) return []

    const studyMap =
      new Map<string, StudySummary>()

    for (const peak of reviewData.peaks) {
      const studyPeak: StudyPeak = {
        id: peak.id,
        x: peak.xMni,
        y: peak.yMni,
        z: peak.zMni,
        contrast: peak.contrast,
        groupsInContrast: peak.groupsInContrast,
        coordinateType: peak.coordinateType,
        anatomicalLabel:
          peak.originalAnatomicalLabel,
      }

      const existing =
        studyMap.get(peak.studyId)

      if (existing) {
        existing.numberOfCoordinates += 1
        existing.peaks.push(studyPeak)

        addUnique(
          existing.peakSources,
          peak.peakSource,
        )

        addUnique(
          existing.sampleSizes,
          cleanSampleSize(peak.nInContrast),
        )

        continue
      }

      const cleanedSampleSize =
        cleanSampleSize(peak.nInContrast)

      studyMap.set(peak.studyId, {
        studyId: peak.studyId,
        authors: peak.authors,
        year: peak.year,
        title: peak.title,
        pmid: peak.pmid,

        peakSources: usable(peak.peakSource)
          ? [peak.peakSource]
          : [],

        sampleSizes: usable(cleanedSampleSize)
          ? [cleanedSampleSize]
          : [],

        numberOfCoordinates: 1,
        peaks: [studyPeak],
      })
    }

    return Array.from(studyMap.values()).sort(
      (a, b) => {
        if (a.year !== b.year) {
          return (
            (a.year ?? 9999) -
            (b.year ?? 9999)
          )
        }

        return a.authors.localeCompare(
          b.authors,
        )
      },
    )
  }, [reviewData])

  const visibleStudies =
    studies.slice(0, 4)

  function selectStudy(
    studyId: string,
  ) {
    if (selectedStudyId === studyId) {
      setSelectedStudyId(null)
      setFocusCoordinate(null)
      return
    }

    setSelectedStudyId(studyId)
    setFocusCoordinate(null)
  }

  function selectPeak(
    studyId: string,
    coordinate: [number, number, number],
  ) {
    setSelectedStudyId(studyId)

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

          <h1>Claustrum Coordinates</h1>

          <p>
            Reported locations from the human
            neuroimaging literature
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
            <h2>Filters</h2>

            <button className="reset-button">
              Reset
            </button>
          </div>

          <Filter
            label="Claustrum focus"
            value="All studies"
          />

          <Filter
            label="Central aim"
            value="All aims"
          />

          <Filter
            label="Peak source / modality"
            value="All modalities"
          />

          <Filter
            label="Population"
            value="All populations"
          />

          <Filter
            label="Patient group"
            value="All groups"
          />

          <Filter
            label="Hemisphere"
            value="Left + Right"
          />

          <Filter
            label="Publication year"
            value="All years"
          />

          <Filter
            label="Original coordinate space"
            value="MNI"
          />

          <Filter
            label="Coordinate type"
            value="All coordinate types"
          />
        </aside>

        <section className="viewer-section">
          <div className="viewer-toolbar">
            <div className="viewer-stats">
              {reviewData ? (
                <>
                  <strong>
                    {reviewData.numberOfCoordinates}
                  </strong>
                  {' '}coordinates
                  <span> · </span>
                  <strong>
                    {reviewData.numberOfStudies}
                  </strong>
                  {' '}studies
                </>
              ) : (
                <>Loading review data…</>
              )}
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
                viewMode === 'multi'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setViewMode('multi')
              }
            >
              4 views
            </button>

            <button
              className={
                viewMode === 'coronal'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setViewMode('coronal')
              }
            >
              Coronal
            </button>

            <button
              className={
                viewMode === 'sagittal'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setViewMode('sagittal')
              }
            >
              Sagittal
            </button>

            <button
              className={
                viewMode === 'axial'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setViewMode('axial')
              }
            >
              Axial
            </button>

            <button
              className={
                viewMode === 'render'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setViewMode('render')
              }
            >
              3D
            </button>
          </div>

          <div className="viewer">
            <BrainViewer
              onLocationChange={setCoords}
              selectedStudyId={selectedStudyId}
              focusCoordinate={focusCoordinate}
              viewMode={viewMode}
            />

            <div className="viewer-footer">
              <div className="coordinate-readout">
                <span className="coordinate-label">
                  MNI
                </span>

                <span className="coord-pill">
                  x {coords[0].toFixed(1)}
                </span>

                <span className="coord-pill">
                  y {coords[1].toFixed(1)}
                </span>

                <span className="coord-pill">
                  z {coords[2].toFixed(1)}
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
            <h2>Studies</h2>

            <p>
              {studies.length} currently visible
            </p>
          </div>

          {visibleStudies.map((study) => (
            <StudyCard
              key={study.studyId}
              study={study}
              selected={
                selectedStudyId ===
                study.studyId
              }
              onSelect={() =>
                selectStudy(study.studyId)
              }
              onPeakSelect={(coordinate) =>
                selectPeak(
                  study.studyId,
                  coordinate,
                )
              }
            />
          ))}

          {studies.length >
            visibleStudies.length && (
            <button className="view-all-button">
              Browse all {studies.length} studies
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
            All displayed coordinates
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
  value: string | null | undefined,
) {
  if (!value) return false

  const cleaned =
    value.trim().toUpperCase()

  return (
    cleaned !== '' &&
    cleaned !== 'NA' &&
    cleaned !== 'NR'
  )
}

function addUnique(
  array: string[],
  value: string,
) {
  if (!usable(value)) return

  if (!array.includes(value)) {
    array.push(value)
  }
}

function cleanSampleSize(
  value: string | null | undefined,
) {
  if (!usable(value)) return ''

  return String(value)
    .trim()
    .replace(/^n\s*=\s*/i, '')
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
    authors.split(';')[0].trim()

  if (!firstAuthor) {
    return authors
  }

  const surname =
    firstAuthor.split(/\s+/)[0]

  return `${surname} et al.`
}

function sampleSizeLabel(
  study: StudySummary,
) {
  if (study.sampleSizes.length === 0) {
    return null
  }

  if (study.sampleSizes.length === 1) {
    return `n = ${study.sampleSizes[0]}`
  }

  return `n = ${study.sampleSizes.join(', ')}`
}

function formatCoordinate(
  value: number,
) {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return value.toFixed(1)
}

type FilterProps = {
  label: string
  value: string
}

function Filter({
  label,
  value,
}: FilterProps) {
  return (
    <label className="filter-group">
      <span>{label}</span>

      <select defaultValue={value}>
        <option value={value}>
          {value}
        </option>
      </select>
    </label>
  )
}

type StudyCardProps = {
  study: StudySummary
  selected: boolean
  onSelect: () => void
  onPeakSelect: (
    coordinate: [number, number, number],
  ) => void
}

function StudyCard({
  study,
  selected,
  onSelect,
  onPeakSelect,
}: StudyCardProps) {
  const source =
    study.peakSources.length > 0
      ? study.peakSources.join(' + ')
      : 'Reported coordinates'

  const coordinateLabel =
    study.numberOfCoordinates === 1
      ? '1 coordinate'
      : `${study.numberOfCoordinates} coordinates`

  const sampleSize =
    sampleSizeLabel(study)

  const contrasts =
    Array.from(
      new Set(
        study.peaks
          .map((peak) => peak.contrast)
          .filter(usable),
      ),
    )

  return (
    <div
      className={
        selected
          ? 'study-card selected'
          : 'study-card'
      }
      title={study.title}
      onClick={onSelect}
    >
      <div className="study-card-top">
        <strong>
          {abbreviatedAuthors(study.authors)}
        </strong>

        <span className="study-year">
          {study.year ?? ''}
        </span>
      </div>

      {usable(study.pmid) && (
        <a
          className="pubmed-link"
          href={`https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(
            study.pmid,
          )}/`}
          target="_blank"
          rel="noreferrer"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          PMID {study.pmid}
        </a>
      )}

      <div className="study-modality">
        {source} · {coordinateLabel}
      </div>

      {selected && (
        <div
          className="study-expanded"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <div className="study-expanded-title">
            {study.title}
          </div>

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

          {contrasts.length > 0 && (
            <div className="study-detail-row">
              <span className="study-detail-label">
                Contrast
              </span>

              <span>
                {contrasts.join('; ')}
              </span>
            </div>
          )}

          <div className="study-peaks-heading">
            Reported peaks
          </div>

          <div className="study-peak-list">
            {study.peaks.map(
              (peak, index) => {
                const peakMeta =
                  [
                    peak.coordinateType,
                    peak.anatomicalLabel,
                  ]
                    .filter(usable)
                    .join(' · ')

                return (
                  <button
                    key={peak.id}
                    type="button"
                    className="study-peak-button"
                    onClick={() =>
                      onPeakSelect([
                        peak.x,
                        peak.y,
                        peak.z,
                      ])
                    }
                  >
                    <span className="study-peak-number">
                      {index + 1}
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
                          {peakMeta}
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