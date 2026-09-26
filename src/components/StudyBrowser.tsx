import { useEffect, useMemo, useState } from 'react'
import StudyCard, { type StudySummary } from './StudyCard'

type StudyBrowserProps = {
  studies: StudySummary[]
  selectedStudyId: string | null
  selectedPeakId: string | null
  onClose: () => void
  onShowAll: () => void
  onStudySelect: (studyId: string) => void
  onPeakSelect: (
    studyId: string,
    peakId: string,
    coordinate: [number, number, number],
  ) => void
}

function StudyBrowser({
  studies,
  selectedStudyId,
  selectedPeakId,
  onClose,
  onShowAll,
  onStudySelect,
  onPeakSelect,
}: StudyBrowserProps) {
  const [studySearch, setStudySearch] =
    useState('')

  const searchedStudies = useMemo(() => {
    const query = studySearch
      .trim()
      .toLowerCase()

    if (!query) {
      return studies
    }

    return studies.filter((study) => {
      const searchableValues = [
        study.authors,
        study.title,
        study.journal,
        study.pmid,
        study.year?.toString() ?? '',
        study.peakSources.join(' '),
      ]

      return searchableValues.some((value) =>
        value
          .toLowerCase()
          .includes(query),
      )
    })
  }, [studies, studySearch])

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [onClose])

  useEffect(() => {
    if (!selectedStudyId) {
      return
    }

    const timer = window.setTimeout(() => {
      const element = document.getElementById(
        `study-browser-${selectedStudyId}`,
      )

      element?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 80)

    return () =>
      window.clearTimeout(timer)
  }, [selectedStudyId, searchedStudies])

  return (
    <>
      <div
        className="study-browser-backdrop"
        onClick={onClose}
      />

      <aside
        className="study-browser-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Browse studies"
      >
        <div className="study-browser-header">
          <div>
            <div className="study-browser-eyebrow">
              CURRENT FILTERS
            </div>

            <h2>Browse studies</h2>

            <p>
              {studies.length}{' '}
              {studies.length === 1
                ? 'study'
                : 'studies'}{' '}
              available
            </p>
          </div>

          <div className="study-browser-header-actions">
            {selectedStudyId && (
              <button
                type="button"
                className="show-all-button"
                onClick={onShowAll}
              >
                Show all
              </button>
            )}

            <button
              type="button"
              className="study-browser-close"
              aria-label="Close study browser"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        <div className="study-browser-search">
          <input
            autoFocus
            type="search"
            value={studySearch}
            placeholder="Search author, title, journal, year, PMID…"
            onChange={(event) =>
              setStudySearch(event.target.value)
            }
          />
        </div>

        <div className="study-browser-result-count">
          {searchedStudies.length}{' '}
          {searchedStudies.length === 1
            ? 'study'
            : 'studies'}
        </div>

        <div className="study-browser-list">
          {searchedStudies.map((study) => (
            <div
              key={study.studyId}
              id={`study-browser-${study.studyId}`}
              className="study-browser-card-wrap"
            >
              <StudyCard
                study={study}
                selected={
                  selectedStudyId ===
                  study.studyId
                }
                selectedPeakId={selectedPeakId}
                onSelect={() =>
                  onStudySelect(study.studyId)
                }
                onPeakSelect={(
                  peakId,
                  coordinate,
                ) =>
                  onPeakSelect(
                    study.studyId,
                    peakId,
                    coordinate,
                  )
                }
              />
            </div>
          ))}

          {searchedStudies.length === 0 && (
            <div className="study-browser-empty">
              <strong>
                No matching studies
              </strong>

              <span>
                Try a different author,
                title, journal, year, or PMID.
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default StudyBrowser
