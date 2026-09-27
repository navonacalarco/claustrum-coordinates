import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import StudyCard, {
  type StudySummary,
} from './StudyCard'

type SortKey =
  | 'year'
  | 'author'
  | 'coordinates'

type SortDirection =
  | 'asc'
  | 'desc'

type StudiesPanelProps = {
  studies: StudySummary[]
  filtered: boolean
  numberOfCoordinates: number
  selectedStudyId: string | null
  selectedPeakId: string | null

  onShowAll: () => void

  onStudySelect: (
    studyId: string,
  ) => void

  onPeakSelect: (
    studyId: string,
    peakId: string,
    coordinate: [number, number, number],
  ) => void
}

function StudiesPanel({
  studies,
  filtered,
  numberOfCoordinates,
  selectedStudyId,
  selectedPeakId,
  onShowAll,
  onStudySelect,
  onPeakSelect,
}: StudiesPanelProps) {
  const [search, setSearch] =
    useState('')

  const [sortKey, setSortKey] =
    useState<SortKey>('year')

  const [
    sortDirection,
    setSortDirection,
  ] =
    useState<SortDirection>(
      'asc',
    )

  const [
    sortMenuOpen,
    setSortMenuOpen,
  ] =
    useState(false)

  const sortMenuRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  const matchingStudies =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return [...studies]
      }

      return studies.filter(
        (study) => {
          const searchableValues = [
            study.authors,
            study.title,
            study.journal,
            study.pmid,
            study.year?.toString() ?? '',
            study.peakSources.join(' '),
            study.patientGroups.join(' '),
          ]

          return searchableValues.some(
            (value) =>
              value
                .toLowerCase()
                .includes(query),
          )
        },
      )
    }, [
      studies,
      search,
    ])

  const displayedStudies =
    useMemo(() => {
      return [...matchingStudies].sort(
        (a, b) => {
          let comparison = 0

          if (sortKey === 'year') {
            comparison =
              (a.year ?? 9999) -
              (b.year ?? 9999)

            if (
              comparison === 0
            ) {
              comparison =
                a.authors.localeCompare(
                  b.authors,
                )
            }
          }

          if (
            sortKey === 'author'
          ) {
            comparison =
              authorSortName(
                a.authors,
              ).localeCompare(
                authorSortName(
                  b.authors,
                ),
              )

            if (
              comparison === 0
            ) {
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

            if (
              comparison === 0
            ) {
              comparison =
                a.authors.localeCompare(
                  b.authors,
                )
            }
          }

          return (
            sortDirection ===
              'asc'
              ? comparison
              : -comparison
          )
        },
      )
    }, [
      matchingStudies,
      sortKey,
      sortDirection,
    ])

  /*
   * If a brain click selects a study that is hidden by
   * the current study-search query, clear only the search
   * so the selected paper can become visible.
   */
  useEffect(() => {
    if (
      !selectedStudyId ||
      !search.trim()
    ) {
      return
    }

    const selectedMatches =
      matchingStudies.some(
        (study) =>
          study.studyId ===
          selectedStudyId,
      )

    if (!selectedMatches) {
      setSearch('')
    }
  }, [
    selectedStudyId,
    search,
    matchingStudies,
  ])

  /*
   * Keep brain → literature navigation intact now that
   * the permanent sidebar replaces the fly-out drawer.
   */
  useEffect(() => {
    if (!selectedStudyId) {
      return
    }

    const timer =
      window.setTimeout(
        () => {
          const element =
            document.getElementById(
              `studies-panel-${selectedStudyId}`,
            )

          element?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          })
        },
        80,
      )

    return () =>
      window.clearTimeout(
        timer,
      )
  }, [
    selectedStudyId,
    displayedStudies,
  ])

  /*
   * Sort behaves like a conventional menu:
   * click elsewhere or press Escape to dismiss it.
   */
  useEffect(() => {
    if (!sortMenuOpen) {
      return
    }

    function handlePointerDown(
      event: PointerEvent,
    ) {
      if (
        event.target instanceof Node &&
        !sortMenuRef.current?.contains(
          event.target,
        )
      ) {
        setSortMenuOpen(false)
      }
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === 'Escape'
      ) {
        setSortMenuOpen(false)
      }
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
  }, [sortMenuOpen])

  function chooseSort(
    nextKey: SortKey,
  ) {
    if (
      nextKey === sortKey
    ) {
      setSortDirection(
        (current) =>
          current === 'asc'
            ? 'desc'
            : 'asc',
      )
    } else {
      setSortKey(nextKey)

      setSortDirection(
        nextKey ===
          'coordinates'
          ? 'desc'
          : 'asc',
      )
    }

    setSortMenuOpen(false)
  }

  return (
    <aside className="studies">
      <div className="studies-header">
        <div className="studies-heading-group">
          <h2>
            {filtered
              ? 'Filtered studies'
              : 'All studies'}
          </h2>

          <div className="studies-summary">
            <strong>
              {studies.length}
            </strong>
            {' '}
            {studies.length === 1
              ? 'study'
              : 'studies'}
            <span aria-hidden="true">
              ·
            </span>
            <strong>
              {numberOfCoordinates}
            </strong>
            {' '}
            {numberOfCoordinates === 1
              ? 'coordinate'
              : 'coordinates'}
          </div>
        </div>

        {selectedStudyId && (
          <button
            type="button"
            className="show-all-button"
            onClick={onShowAll}
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="studies-search">
        <input
          type="search"
          value={search}
          placeholder="Search authors, diagnosis, journal"
          aria-label="Search authors, diagnosis, journal, title, year, or PMID"
          onChange={(event) =>
            setSearch(
              event.target.value,
            )
          }
        />
      </div>

      <div className="studies-toolbar">
        <div className="studies-search-status">
          {search.trim() &&
            `${displayedStudies.length} matching`}
        </div>

        <div
          ref={sortMenuRef}
          className="study-sort"
        >
          <button
            type="button"
            className="study-sort-trigger"
            aria-haspopup="menu"
            aria-expanded={
              sortMenuOpen
            }
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
              {sortDirection ===
                'asc'
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
                direction={
                  sortDirection
                }
                onChoose={
                  chooseSort
                }
              />

              <SortOption
                label="Author"
                sortKey="author"
                activeKey={sortKey}
                direction={
                  sortDirection
                }
                onChoose={
                  chooseSort
                }
              />

              <SortOption
                label="Coordinates"
                sortKey="coordinates"
                activeKey={sortKey}
                direction={
                  sortDirection
                }
                onChoose={
                  chooseSort
                }
              />
            </div>
          )}
        </div>
      </div>

      <div className="studies-list">
        {displayedStudies.map(
          (study) => (
            <div
              key={study.studyId}
              id={`studies-panel-${study.studyId}`}
              className="studies-panel-card-wrap"
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
          <div className="no-results">
            No studies match this search.
          </div>
        )}
      </div>
    </aside>
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
          {direction ===
            'asc'
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
  if (
    sortKey === 'author'
  ) {
    return 'Author'
  }

  if (
    sortKey ===
    'coordinates'
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

export default StudiesPanel
