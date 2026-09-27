import {
  useEffect,
  useRef,
  useState,
} from 'react'

type DownloadMenuProps = {
  showCurrentSelection?: boolean
  onDownloadAll: () => void
  onDownloadCurrent: () => void
}

function DownloadMenu({
  showCurrentSelection = false,
  onDownloadAll,
  onDownloadCurrent,
}: DownloadMenuProps) {
  const [open, setOpen] =
    useState(false)

  const menuRef =
    useRef<HTMLDivElement | null>(
      null,
    )

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(
      event: PointerEvent,
    ) {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(
          event.target,
        )
      ) {
        setOpen(false)
      }
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === 'Escape'
      ) {
        setOpen(false)
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
  }, [open])

  function downloadAll() {
    onDownloadAll()
    setOpen(false)
  }

  function downloadCurrent() {
    onDownloadCurrent()
    setOpen(false)
  }

  return (
    <div
      ref={menuRef}
      className="download-menu"
    >
      <button
        type="button"
        className="button primary download-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() =>
          setOpen(
            (current) =>
              !current,
          )
        }
      >
        Download data
        <span
          className="download-menu-chevron"
          aria-hidden="true"
        >
          ⌄
        </span>
      </button>

      {open && (
        <div
          className="download-menu-popover"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="download-menu-option"
            onClick={
              downloadAll
            }
          >
            <span>
              All data
            </span>
          </button>

          {showCurrentSelection && (
            <button
              type="button"
              role="menuitem"
              className="download-menu-option"
              onClick={
                downloadCurrent
              }
            >
              <span>
                Current selection
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default DownloadMenu
