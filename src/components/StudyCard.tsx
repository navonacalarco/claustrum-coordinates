import { reviewTags } from './reviewFilters'

export type StudyPeak = {
  id: string
  x: number
  y: number
  z: number
  xOriginal: number | null
  yOriginal: number | null
  zOriginal: number | null
  originalSpace: string
  transformation: string
  contrast: string
  taskDomain: string
  groupsInContrast: string
  coordinateType: string
  anatomicalLabel: string
}

export type StudySummary = {
  studyId: string
  authors: string
  year: number | null
  title: string
  journal: string
  pmid: string
  peakSources: string[]
  patientGroups: string[]
  sampleSizes: string[]
  ageGroups: string[]
  studyDesigns: string[]
  numberOfCoordinates: number
  peaks: StudyPeak[]
}

type StudyCardProps = {
  study: StudySummary
  selected: boolean
  selectedPeakId?: string | null
  onSelect: () => void

  onPeakSelect: (
    peakId: string,
    coordinate: [number, number, number],
  ) => void
}

function StudyCard({
  study,
  selected,
  selectedPeakId = null,
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
          .map(
            (peak) =>
              peak.contrast,
          )
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
      onClick={onSelect}
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

      <div className="study-card-meta">
        <span>
          {source}
        </span>

        <span aria-hidden="true">
          ·
        </span>

        <span>
          {coordinateLabel}
        </span>
      </div>

      {usable(study.pmid) && (
        <div className="study-card-pmid-row">
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
        </div>
      )}

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

          {usable(study.journal) && (
            <div className="study-journal">
              {study.journal}
            </div>
          )}

          {(
            sampleSize ||
            contrasts.length > 0
          ) && (
            <div className="study-expanded-meta">
              {[
                ['Age at scan', study.ageGroups.join('; ')],
                ['Study design', study.studyDesigns.join('; ')],
              ].map(([label, value]) => value && (
                <div className="study-detail-row" key={label}>
                  <span className="study-detail-label">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
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
            </div>
          )}

          <div className="study-peaks-heading">
            Reported peaks
          </div>

          <div className="study-peak-list">
            {study.peaks.map(
              (peak, index) => {
                const peakMeta = [
                  peak.coordinateType,
                  peak.anatomicalLabel,
                ]
                  .filter(usable)
                  .join(' · ')

                return (
                  <button
                    key={peak.id}
                    type="button"
                    className={
                      selectedPeakId === peak.id
                        ? 'study-peak-button selected-peak'
                        : 'study-peak-button'
                    }
                    onClick={() =>
                      onPeakSelect(
                        peak.id,
                        [
                          peak.x,
                          peak.y,
                          peak.z,
                        ],
                      )
                    }
                  >
                    <span className="study-peak-number">
                      {index + 1}
                    </span>

                    <span className="study-peak-content">
                      {isTransformedPeak(
                        peak,
                      ) ? (
                        <>
                          <span className="study-peak-coordinate-row">
                            <span className="study-coordinate-label">
                              Reported
                            </span>

                            <span className="study-peak-coordinate">
                              {formatCoordinate(
                                peak.xOriginal as number,
                              )}
                              ,{' '}
                              {formatCoordinate(
                                peak.yOriginal as number,
                              )}
                              ,{' '}
                              {formatCoordinate(
                                peak.zOriginal as number,
                              )}
                              {' · '}
                              {displaySpace(
                                peak.originalSpace,
                              )}
                            </span>
                          </span>

                          <span className="study-peak-coordinate-row">
                            <span className="study-coordinate-label">
                              Displayed
                            </span>

                            <span className="study-peak-coordinate">
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
                              {' · MNI'}
                            </span>
                          </span>
                        </>
                      ) : (
                        <span className="study-peak-coordinate">
                          {formatCoordinate(
                            reportedCoordinate(
                              peak.xOriginal,
                              peak.x,
                            ),
                          )}
                          ,{' '}
                          {formatCoordinate(
                            reportedCoordinate(
                              peak.yOriginal,
                              peak.y,
                            ),
                          )}
                          ,{' '}
                          {formatCoordinate(
                            reportedCoordinate(
                              peak.zOriginal,
                              peak.z,
                            ),
                          )}
                          {' · '}
                          {displaySpace(
                            peak.originalSpace,
                          )}
                        </span>
                      )}

                      {peak.taskDomain && (
                        <span className="study-peak-meta">
                          Task domain: {reviewTags(peak.taskDomain).join('; ')}
                        </span>
                      )}
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

function usable(
  value: string | null | undefined,
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
    study.sampleSizes.length === 0
  ) {
    return null
  }

  if (
    study.sampleSizes.length === 1
  ) {
    return study.sampleSizes[0]
  }

  return study.sampleSizes.join(', ')
}

function reportedCoordinate(
  original: number | null,
  displayed: number,
) {
  return original ??
    displayed
}

function normalizedSpace(
  value: string,
) {
  return value
    .trim()
    .toLowerCase()
}

function displaySpace(
  value: string,
) {
  const normalized =
    normalizedSpace(value)

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

  return value || 'MNI'
}

function isTransformedPeak(
  peak: StudyPeak,
) {
  const hasOriginalCoordinates =
    peak.xOriginal !== null &&
    peak.yOriginal !== null &&
    peak.zOriginal !== null

  if (!hasOriginalCoordinates) {
    return false
  }

  const normalized =
    normalizedSpace(
      peak.originalSpace,
    )

  return (
    normalized !== '' &&
    !normalized.includes(
      'mni',
    )
  )
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

export default StudyCard

