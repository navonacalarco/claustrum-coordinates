import {
  useEffect,
  useRef,
} from 'react'

type AboutModalProps = {
  open: boolean
  numberOfCoordinates:
    number | null
  numberOfStudies:
    number | null
  onClose: () => void
}

function AboutModal({
  open,
  numberOfCoordinates,
  numberOfStudies,
  onClose,
}: AboutModalProps) {
  const closeButtonRef =
    useRef<HTMLButtonElement | null>(
      null,
    )

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      'hidden'

    const timer =
      window.setTimeout(
        () =>
          closeButtonRef.current
            ?.focus(),
        0,
      )

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === 'Escape'
      ) {
        onClose()
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      window.clearTimeout(timer)

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )

      document.body.style.overflow =
        previousOverflow
    }
  }, [
    open,
    onClose,
  ])

  if (!open) {
    return null
  }

  const coordinateCount =
    numberOfCoordinates ??
    '…'

  const studyCount =
    numberOfStudies ??
    '…'

  return (
    <div
      className="about-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <section
        className="about-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
      >
        <div className="about-modal-header">
          <div>
            <div className="about-kicker">
              ABOUT
            </div>

            <h2 id="about-title">
              Claustrum Coordinates
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="about-close"
            aria-label="Close About"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="about-content">
          <AboutSection
            title=""
          >
            <p>
              <strong>
                Claustrum Coordinates
              </strong>{' '}
              accompanies a systematic
              review of human MRI studies
              that analyze the claustrum
              (Calarco et al.,
              forthcoming). This resource
              brings together reported claustral
              stereotaxic coordinates in a single
              interactive atlas. 
            </p>
          </AboutSection>

          <AboutSection
            title="What’s included"
          >
            <p>
              The current release contains{' '}
              <strong>
                {coordinateCount}
              </strong>{' '}
              coordinates from{' '}
              <strong>
                {studyCount}
              </strong>{' '}
              studies, identified through
              a systematic search up to{' '}
              <strong>
                [search date]
              </strong>.              
            </p>
          </AboutSection>

          <AboutSection
            title="Using the viewer"
          >
            <p>
              The interface has three
              linked panels: filters on
              the left, the brain viewer
              in the centre, and studies
              on the right. Filters can be
              combined to narrow
              coordinates displayed; the brain and study
              list update together.
              Red points
              are reported literature
              coordinates. Click a point
              to identify its source
              study, or select a study to
              highlight its
              reported coordinates in blue.
              Set spatial filter
              lets you draw a 3D box or
              enter its bounds,
              and can be combined with
              the other filters. The study
              panel can be searched and
              sorted, and individual peaks
              can be selected to navigate
              directly to them. 
              Download data
              provides the complete
              dataset or, when filters are
              active, the current
              selection.
            </p>
          </AboutSection>

          <AboutSection
            title="Important caveats"
          >
            <p>
              Coordinates and anatomical
              labels are reproduced from
              the literature and do not
              constitute independent
              verification or endorsement
              of the original
              localization.               
              Coordinates are displayed on the{' '}
              `MNI152 2009c nonlinear
              asymmetric template`; those originally
              reported in Talairach space
              were converted to MNI using{' '}
              [transformation].
              This resource is not a
              meta-analysis and does not
              weight coordinates by sample
              size, statistical threshold,
              study quality, or other
              methodological features.
            </p>
          </AboutSection>

          <AboutSection
            title="Issues"
          >
            <p>
              If a relevant paper is missing,
              or you identify an incorrect
              coordinate, please{' '}
              <a
                href="https://github.com/navonacalarco/claustrum-coordinates/issues"
                target="_blank"
                rel="noreferrer"
              >
                open a GitHub issue
              </a>
              .
            </p>
          </AboutSection>

          <AboutSection
            title="Citation"
          >
            <p>
              For use of the web viewer, please cite:
              <br />
              <strong>
                [Zenodo citation]
              </strong>
            </p>

            <p>
              For the systematic review,
              please cite:
              <br />
              <strong>
                Calarco et al., 2026,
                forthcoming.
              </strong>
            </p>
          </AboutSection>
        </div>
      </section>
    </div>
  )
}

type AboutSectionProps = {
  title: string
  children: React.ReactNode
}

function AboutSection({
  title,
  children,
}: AboutSectionProps) {
  return (
    <section className="about-section">
      <h3>
        {title}
      </h3>

      {children}
    </section>
  )
}

export default AboutModal
