import { useEffect, useMemo, useState } from 'react'
import StudyCard, { type StudySummary } from './StudyCard'

type SortKey =
  | 'year'
  | 'author'
  | 'coordinates'

type SortDirection =
  | 'asc'
  | 'desc'

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

  const [sortKey, setSortKey] =
    useState<SortKey>('year')

  const [sortDirection, setSortDirection] =
    useState<SortDirection>('asc')

  const [sortMenuOpen, setSortMenuOpen] =
    useState(false)

  const displayedStudies =
    useMemo(() => {
      const query = studySearch
        .trim()
        .toLowerCase()

      const matchingStudies =
        query
          ? studies.filter((study) => {
              const searchableValues = [
                study.authors,
                study.title,
                study.journal,
                study.pmid,
                study.year?.toString() ?? '',
                study.peakSources.join(' '),
              ]

              return searchableValues.some(
                (value) =>
                  value
                    .toLowerCase()
                    .includes(query),
              )
            })
          : [...studies]

      return matchingStudies.sort(
        (a, b) => {
          let comparison = 0

          if (sortKey === 'year') {
            comparison =
              (a.year ?? 9999) -
              (b.year ?? 9999)

            if (comparison === 0) {
              comparison =
                a.authors.localeCompare(
                  b.authors,
                )
            }
          }

          if (sortKey === 'author') {
            comparison =
              authorSortName(
                a.authors,
              ).localeCompare(
                authorSortName(
                  b.authors,
                ),
              )

            if (comparison === 0) {
              comparison =
                (a.year ?? 9999) -
                (b.year ?? 9999)
            }
          }

          if (
            sortKey ===
            'coordinates'
          ) {
            comparison =
              a.numberOfCoordinates -
              b.numberOfCoordinates

            if (comparison === 0) {
              comparison =
                a.authors.localeCompare(
                  b.authors,
                )
            }
          }

          return sortDirection ===
            'asc'
            ? comparison
            : -comparison
        },
      )
    }, [
      studies,
      studySearch,
      sortKey,
      sortDirection,
    ])

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        if (sortMenuOpen) {
          setSortMenuOpen(false)
          return
        }

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
  }, [
    onClose,
    sortMenuOpen,
  ])

  useEffect(() => {
    if (!selectedStudyId) {
      return
    }

    const timer =
      window.setTimeout(() => {
        const element =
          document.getElementById(
            `study-browser-${selectedStudyId}`,
          )

        element?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 80)

    return () =>
      window.clearTimeout(timer)
  }, [
    selectedStudyId,
    displayedStudies,
  ])

  function chooseSort(
    nextKey: SortKey,
  ) {
    if (nextKey === sortKey) {
      setSortDirection(
        (current) =>
          current === 'asc'
            ? 'desc'
            : 'asc',
      )
    } else {
      setSortKey(nextKey)

      setSortDirection(
        nextKey === 'coordinates'
          ? 'desc'
          : 'asc',
      )
    }

    setSortMenuOpen(false)
  }

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
          <h2>
            Browse studies
          </h2>

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
              setStudySearch(
                event.target.value,
              )
            }
          />
        </div>

        <div className="study-browser-controls">
          <div className="study-browser-result-count">
            {displayedStudies.length}{' '}
            {displayedStudies.length === 1
              ? 'study'
              : 'studies'}
          </div>

          <div className="study-sort">
            <button
              type="button"
              className="study-sort-trigger"
              aria-haspopup="menu"
              aria-expanded={sortMenuOpen}
              onClick={() =>
                setSortMenuOpen(
                  (current) =>
                    !current,
                )
              }
            >
              Sort: {sortLabel(sortKey)}
              <span
                className="study-sort-direction"
                aria-hidden="true"
              >
                {sortDirection === 'asc'
                  ? '↑'
                  : '↓'}
              </span>
            </button>

            {sortMenuOpen && (
              <div
                className="study-sort-menu"
                role="menu"
              >
                <SortOption
                  label="Year"
                  sortKey="year"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onChoose={chooseSort}
                />

                <SortOption
                  label="Author"
                  sortKey="author"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onChoose={chooseSort}
                />

                <SortOption
                  label="Coordinates"
                  sortKey="coordinates"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onChoose={chooseSort}
                />
              </div>
            )}
          </div>
        </div>

        <div className="study-browser-list">
          {displayedStudies.map(
            (study) => (
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
                  selectedPeakId={
                    selectedPeakId
                  }
                  showTitleTooltip={false}
                  onSelect={() =>
                    onStudySelect(
                      study.studyId,
                    )
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
            ),
          )}

          {displayedStudies.length ===
            0 && (
            <div className="study-browser-empty">
              <strong>
                No matching studies
              </strong>

              <span>
                Try a different author,
                title, journal, year,
                or PMID.
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

type SortOptionProps = {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  direction: SortDirection
  onChoose: (
    sortKey: SortKey,
  ) => void
}

function SortOption({
  label,
  sortKey,
  activeKey,
  direction,
  onChoose,
}: SortOptionProps) {
  const active =
    sortKey === activeKey

  return (
    <button
      type="button"
      role="menuitem"
      className={
        active
          ? 'study-sort-option active'
          : 'study-sort-option'
      }
      onClick={() =>
        onChoose(sortKey)
      }
    >
      <span>
        {label}
      </span>

      {active && (
        <span aria-hidden="true">
          {direction === 'asc'
            ? '↑'
            : '↓'}
        </span>
      )}
    </button>
  )
}

function sortLabel(
  sortKey: SortKey,
) {
  if (sortKey === 'author') {
    return 'Author'
  }

  if (
    sortKey === 'coordinates'
  ) {
    return 'Coordinates'
  }

  return 'Year'
}

function authorSortName(
  authors: string,
) {
  return authors
    .split(';')[0]
    .trim()
    .toLowerCase()
}

export default StudyBrowser
