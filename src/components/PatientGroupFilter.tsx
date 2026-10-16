import { useId, useRef, useState } from 'react'

type Props = {
  value: string[]
  options: string[]
  disabled: boolean
  disabledText: string
  onChange: (value: string[]) => void
}

export default function PatientGroupFilter({
  value, options, disabled, disabledText, onChange,
}: Props) {
  const [open, setOpen] = useState(true)
  const [query, setQuery] = useState('')
  const summaryRef = useRef<HTMLElement>(null)
  const searchId = useId()
  const visible = options.filter((option) =>
    option.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))

  function toggle(option: string) {
    onChange(value.includes(option)
      ? value.filter((item) => item !== option)
      : [...value, option])
  }

  function close() {
    setOpen(false)
    summaryRef.current?.focus()
  }

  return (
    <div className="filter-group patient-group-filter">
      <span>Patient groups</span>
      {disabled ? (
        <div className="multi-select-disabled" aria-disabled="true">{disabledText}</div>
      ) : (
        <>
          <details
            className="multi-select patient-group-foldout"
            open={open}
            onToggle={(event) => setOpen(event.currentTarget.open)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && open) {
                event.preventDefault()
                event.stopPropagation()
                close()
              }
            }}
          >
            <summary ref={summaryRef}>
              {value.length ? `${value.length} group${value.length === 1 ? '' : 's'} selected` : 'Choose groups'}
            </summary>
            <div className="patient-group-content">
              <label className="patient-group-search-label" htmlFor={searchId}>Search patient groups</label>
              <input
                id={searchId}
                className="patient-group-search"
                type="search"
                placeholder="Search groups…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="patient-group-toolbar">
                <span role="status">{visible.length} of {options.length} groups</span>
                <button type="button" onClick={() => onChange([])} disabled={!value.length}>
                  Clear selection
                </button>
              </div>
              <div className="patient-group-options" role="group" aria-label="Patient groups">
                {visible.map((option) => (
                  <label key={option} className="multi-select-option">
                    <input type="checkbox" checked={value.includes(option)} onChange={() => toggle(option)} />
                    <span>{option}</span>
                  </label>
                ))}
                {!visible.length && (
                  <p className="patient-group-empty">
                    {options.length ? 'No groups match your search.' : 'No groups available for these categories.'}
                  </p>
                )}
              </div>
              <div className="patient-group-footer">
                <span>{value.length ? 'Matches any selected group' : 'All groups included'}</span>
                <button type="button" onClick={close}>Done</button>
              </div>
            </div>
          </details>
          {value.length > 0 && (
            <ul className="patient-group-selections" aria-label="Selected patient groups">
              {value.map((group) => (
                <li key={group}>
                  <button type="button" onClick={() => toggle(group)} aria-label={`Remove ${group}`}>
                    <span>{group}</span><span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
