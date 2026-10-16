import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

// Refresh the public viewer dataset and its website classifications from Table 1.
const input = process.argv[2]
if (!input) throw new Error('Usage: node scripts/refresh-review-data.mjs <table-1.xlsx|snapshot.json>')
const source = input.endsWith('.json') ? JSON.parse(fs.readFileSync(input, 'utf8')) : (() => {
  const book = XLSX.readFile(input)
  const read = name => {
    if (!book.Sheets[name]) throw new Error(`Missing tab: ${name}`)
    return XLSX.utils.sheet_to_json(book.Sheets[name], { header: 1, defval: '', range: 1 })
  }
  return { studies: read('All studies - MRI information'), peaks: read('Peak reporting') }
})()
function records(rows, required) {
  const headers = rows[0].map(v => String(v).trim())
  for (const name of required) if (!headers.includes(name)) throw new Error(`Missing column: ${name}`)
  return rows.slice(1).filter(r => r.some(v => String(v).trim())).map(r =>
    Object.fromEntries(headers.map((h, i) => [h, String(r[i] ?? '').trim()])))
}
const studies = records(source.studies, ['PMID', 'Paper title', 'Age group (website)', 'Article category - website'])
const rows = records(source.peaks, ['PMID', 'Paper title', 'Coordinate space', 'X coordinate', 'Y coordinate', 'Z coordinate', 'Contrast / comparison (as reported)', 'Contrast category - website'])
const usable = v => v && !['NA', 'NR'].includes(v.toUpperCase())
const titleKey = v => v.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/data')
const previous = JSON.parse(fs.readFileSync(path.join(dataDir, 'peaks-mni.json'), 'utf8')).peaks
const peakFields = {
  authors: 'Authors', journal: 'Journal name', title: 'Paper title', pmid: 'PMID',
  clusterNumber: 'Cluster number (sequential)', peakSource: 'Peak source', mapType: 'Map type',
  coordinateType: 'Coordinate type', clusterSize: 'Cluster size', clusterSizeUnit: 'Cluster size unit',
  hemisphere: 'Hemisphere', originalSpace: 'Coordinate space', originalAnatomicalLabel: 'Original anatomical label',
  otherLabelsInCluster: 'Other label(s) in same cluster', contrast: 'Contrast / comparison (as reported)',
  groupsInContrast: 'Groups in contrast', nInContrast: 'N in contrast', direction: 'Direction of effect',
  software: 'Software used (peaks)', labellingMethod: 'Labelling method', searchSpace: 'Search space',
  smoothingFwhm: 'Smoothing FWHM (mm)', correctionMethod: 'Multiple comparison correction method',
  sourceInPaper: 'Source in paper', notes: 'Notes',
}
const studyFields = {
  doi: 'DOI', claustrumFocus: 'Primarily or secondarily claustrum', articleCategory: 'Article category',
  centralAim: 'Central analytical aim', fieldStrength: 'MRI field strength(s)',
  modalities: 'Modalities collected / analysed', population: 'Patients or HC?',
  patientCategory: 'Patient category', patientGroupWebsite: 'Patient group (website)', patientGroup: 'Patient group(s)',
}
const published = []
for (const [i, row] of rows.entries()) {
  if (row['Coordinate space'].toLowerCase() !== 'mni') continue
  const xyz = ['X coordinate', 'Y coordinate', 'Z coordinate'].map(k => usable(row[k]) ? Number(row[k]) : NaN)
  if (!xyz.every(Number.isFinite)) throw new Error(`Invalid MNI coordinate at row ${i + 3}`)
  let matches = usable(row.PMID) ? studies.filter(s => s.PMID === row.PMID) : []
  if (matches.length !== 1) matches = studies.filter(s => titleKey(s['Paper title']) === titleKey(row['Paper title']))
  if (matches.length !== 1) throw new Error(`Ambiguous study match at row ${i + 3}`)
  const peak = Object.fromEntries(Object.entries(peakFields).map(([k, h]) => [k, row[h] ?? '']))
  Object.assign(peak, Object.fromEntries(Object.entries(studyFields).map(([k, h]) => [k, matches[0][h] ?? ''])))
  const old = previous.find(p => p.pmid === peak.pmid && titleKey(p.title) === titleKey(peak.title) && p.contrast === peak.contrast &&
    p.xOriginal === xyz[0] && p.yOriginal === xyz[1] && p.zOriginal === xyz[2])
  const studyId = old?.studyId ?? (usable(peak.pmid) ? `pmid-${peak.pmid}` : `title-${titleKey(peak.title)}`)
  Object.assign(peak, { id: old?.id ?? `${studyId}-row-${i + 3}`, studyId,
    year: Number(row.Year) || null, xOriginal: xyz[0], yOriginal: xyz[1], zOriginal: xyz[2],
    xMni: xyz[0], yMni: xyz[1], zMni: xyz[2], transformation: 'None — originally reported in MNI space' })
  published.push(peak)
}
if (new Set(published.map(p => p.id)).size !== published.length) throw new Error('Duplicate peak IDs')
const classifications = {}
for (const peak of published) {
  const matches = rows.filter(r => r.PMID === peak.pmid && titleKey(r['Paper title']) === titleKey(peak.title) &&
    r['Coordinate space'] === peak.originalSpace && r['Contrast / comparison (as reported)'] === peak.contrast &&
    ['X coordinate', 'Y coordinate', 'Z coordinate'].every((k, i) => usable(r[k]) && Number(r[k]) === [peak.xOriginal, peak.yOriginal, peak.zOriginal][i]))
  if (matches.length !== 1) throw new Error(`Ambiguous coordinate match: ${peak.id}`)
  let studyMatches = usable(peak.pmid) ? studies.filter(s => s.PMID === peak.pmid) : []
  if (studyMatches.length !== 1) studyMatches = studies.filter(s => titleKey(s['Paper title']) === titleKey(peak.title))
  if (studyMatches.length !== 1) throw new Error(`Ambiguous study match: ${peak.id}`)
  const fields = {
    ageGroupWebsite: studyMatches[0]['Age group (website)'],
    articleCategoryWebsite: studyMatches[0]['Article category - website'],
    contrastCategoryWebsite: matches[0]['Contrast category - website'],
  }
  if (Object.values(fields).some(v => !v)) throw new Error(`Incomplete classification: ${peak.id}`)
  classifications[peak.id] = fields
}
const result = { displaySpace: 'MNI', status: 'Reported MNI coordinates only — Talairach harmonization pending',
  numberOfCoordinates: published.length, numberOfStudies: new Set(published.map(p => p.studyId)).size, peaks: published }
fs.writeFileSync(path.join(dataDir, 'peaks-mni.json'), JSON.stringify(result, null, 2) + '\n')
fs.writeFileSync(path.join(dataDir, 'peak-classifications.json'), JSON.stringify(classifications, null, 2) + '\n')
console.log(`Updated ${published.length} MNI coordinates from ${result.numberOfStudies} studies and their classifications.`)
