import { useEffect, useRef, useState } from 'react'

type Props = {
  categories: string[]
  groupsByCategory: Record<string, string[]>
  selected: string[]
  groups: string[]
  disabled: boolean
  onCategoriesChange: (value: string[]) => void
  onGroupsChange: (value: string[]) => void
}

export default function PatientCategoryFilter({ categories, groupsByCategory, selected, groups, disabled, onCategoriesChange, onGroupsChange }: Props) {
  const ref = useRef<HTMLDetailsElement>(null)
  const [active, setActive] = useState<string | null>(null)
  const current = active && selected.includes(active) ? active : null
  const options = current ? groupsByCategory[current] ?? [] : []
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target) && ref.current) ref.current.open = false
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])
  function activate(category: string) { setActive(category) }
  return <div className="filter-group patient-category-filter">
    <span>Patient category</span>
    {disabled ? <div className="multi-select-disabled">Not applicable to healthy-control-only studies</div> :
      <details ref={ref} className="multi-select" onKeyDown={event => {
        if (event.key === 'Escape' && ref.current) {
          ref.current.open = false
          ref.current.querySelector('summary')?.focus()
        }
      }}>
        <summary>{selected.length ? `${selected.length} categor${selected.length === 1 ? 'y' : 'ies'}${groups.length ? ` · ${groups.length} groups` : ''}` : 'All categories'}</summary>
        <div className="patient-category-menu">
          <div className="patient-category-options">
            <button type="button" className="multi-select-all" onClick={() => { onCategoriesChange([]); setActive(null) }}>All categories</button>
            {categories.map(category => <div key={category} className={`patient-category-row${current === category ? ' active' : ''}`}
              onMouseEnter={() => { if (selected.includes(category)) activate(category) }}>
              <label className="multi-select-option">
                <input type="checkbox" checked={selected.includes(category)} onChange={() => {
                  const checked = selected.includes(category)
                  onCategoriesChange(checked ? selected.filter(v => v !== category) : [...selected, category])
                  activate(category)
                }} />
                <span>{category}</span>
              </label>
              {selected.includes(category) && <button type="button" className="patient-subgroup-trigger"
                aria-label={`Show groups for ${category}`} aria-expanded={current === category}
                onFocus={() => activate(category)} onClick={() => activate(category)}>›</button>}
            </div>)}
          </div>
          {current && <section className="patient-category-flyout" aria-label={`Patient groups: ${current}`}>
            <div className="patient-flyout-heading"><strong>{current}</strong><button type="button" aria-label="Close patient groups" onClick={() => setActive(null)}>×</button></div>
            <div className="patient-group-options">
              {options.map(group => <label className="multi-select-option" key={group}>
                <input type="checkbox" checked={groups.includes(group)} onChange={() => onGroupsChange(groups.includes(group) ? groups.filter(v => v !== group) : [...groups, group])} />
                <span>{group}</span>
              </label>)}
            </div>
          </section>}
        </div>
      </details>}
  </div>
}
