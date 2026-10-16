import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

// Export only the three website classification fields for already published peaks.
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
const published = JSON.parse(fs.readFileSync(path.join(dataDir, 'peaks-mni.json'), 'utf8')).peaks
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
fs.writeFileSync(path.join(dataDir, 'peak-classifications.json'), JSON.stringify(classifications, null, 2) + '\n')
console.log(`Updated classifications for ${published.length} already published coordinates.`)
