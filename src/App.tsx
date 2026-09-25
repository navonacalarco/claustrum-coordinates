import { useState } from 'react'
import './App.css'
import BrainViewer from './components/BrainViewer'

function App() {
  const [coords, setCoords] = useState<[number, number, number]>([0, 0, 0])
  return (
    <div className="app">
      <header className="site-header">
        <div>
          <div className="eyebrow">SYSTEMATIC REVIEW COMPANION</div>

          <h1>Claustrum Coordinates</h1>

          <p className="subtitle">
            Reported locations from the human neuroimaging literature
          </p>
        </div>

        <div className="header-actions">
          <button className="button secondary">About</button>
          <button className="button primary">Download data</button>
        </div>
      </header>

      <main className="workspace">
        <aside className="filters">
          <div className="panel-heading">
            <h2>Filters</h2>
            <button className="text-button">Reset</button>
          </div>

          <Filter label="Claustrum focus" value="All studies" />
          <Filter label="Central aim" value="All aims" />
          <Filter label="Peak source / modality" value="All modalities" />
          <Filter label="Population" value="All populations" />
          <Filter label="Patient group" value="All groups" />
          <Filter label="Hemisphere" value="Left + Right" />
          <Filter label="Publication year" value="All years" />
          <Filter
            label="Original coordinate space"
            value="MNI + Talairach"
          />
          <Filter label="Coordinate type" value="All coordinate types" />
        </aside>

        <section className="viewer-section">
          <div className="viewer-toolbar">
            <div>
              <span className="stat-strong">86</span> coordinates
              <span className="dot">·</span>
              <span className="stat-strong">40</span> studies
            </div>

            <div className="toolbar-controls">
              <button className="segmented active">Points</button>
              <button className="segmented">
                Study-weighted density
              </button>
            </div>
          </div>

          <div className="viewer">
            <BrainViewer onLocationChange={setCoords} />

            <div className="viewer-footer">
              <div className="coordinate-readout">
                <span className="coordinate-label">MNI</span>
                <span className="coord-pill">x {coords[0].toFixed(1)}</span>
                <span className="coord-pill">y {coords[1].toFixed(1)}</span>
                <span className="coord-pill">z {coords[2].toFixed(1)}</span>
              </div>

              <button className="button secondary small">
                Select 3D region
              </button>
            </div>
          </div>
        </section>

        <aside className="studies">
          <div className="panel-heading">
            <div>
              <h2>Studies</h2>
              <p className="muted">40 currently visible</p>
            </div>
          </div>

          <StudyCard
            author="Brattico et al."
            year="2011"
            meta="task-fMRI · HC"
            peaks="1 coordinate"
          />

          <StudyCard
            author="Cascella et al."
            year="2011"
            meta="VBM · Schizophrenia"
            peaks="1 coordinate"
          />

          <StudyCard
            author="Krimmel et al."
            year="2019"
            meta="rs-fMRI · HC"
            peaks="4 coordinates"
          />

          <button className="show-all">View all studies</button>
        </aside>
      </main>

      <section className="selection-bar">
        <div>
          <strong>Current selection</strong>
          <span>All coordinates</span>
        </div>

        <div className="selection-actions">
          <button className="text-button">
            Enter bounding coordinates
          </button>

          <button className="button secondary">
            Download selection CSV
          </button>
        </div>
      </section>
    </div>
  )
}

function Filter({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <label className="filter">
      <span>{label}</span>

      <button className="filter-control">
        <span>{value}</span>
        <span className="chevron">⌄</span>
      </button>
    </label>
  )
}

function StudyCard({
  author,
  year,
  meta,
  peaks,
}: {
  author: string
  year: string
  meta: string
  peaks: string
}) {
  return (
    <button className="study-card">
      <div className="study-topline">
        <strong>{author}</strong>
        <span>{year}</span>
      </div>

      <div className="study-meta">{meta}</div>
      <div className="study-peaks">{peaks}</div>
    </button>
  )
}

export default App