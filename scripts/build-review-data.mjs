import * as XLSXModule from 'xlsx'
import fs from 'node:fs'
import path from 'node:path'

const XLSX = XLSXModule.default ?? XLSXModule

const inputFile = path.resolve('data-source/TABLE 1.xlsx')
const outputFile = path.resolve('public/data/peaks-mni.json')

if (!fs.existsSync(inputFile)) {
  throw new Error(`Could not find workbook: ${inputFile}`)
}

const fileBuffer = fs.readFileSync(inputFile)

const workbook = XLSX.read(fileBuffer, {
  type: 'buffer',
})

const peakSheet = workbook.Sheets['Peak reporting']
const allStudiesSheet = workbook.Sheets['All studies - structural']

if (!allStudiesSheet) {
  throw new Error('Could not find "All studies - structural" sheet')
}

// Row 1 contains section labels.
// Row 2 contains the actual column headers.
const peakRows = XLSX.utils.sheet_to_json(peakSheet, {
  range: 1,
  defval: '',
})

const allStudyRows = XLSX.utils.sheet_to_json(allStudiesSheet, {
  range: 1,
  defval: '',
})

function clean(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function usable(value) {
  const v = clean(value)
  return v !== '' && v !== 'NA' && v !== 'NR'
}

function normalizeTitle(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function numeric(value) {
  const cleaned = clean(value)
    .replace(/−/g, '-')
    .replace(/,/g, '')

  if (cleaned === '') return null

  const number = Number(cleaned)
  return Number.isFinite(number) ? number : null
}

function slug(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

function studyId(row) {
  const pmid = clean(row['PMID'])

  if (usable(pmid)) {
    return `pmid-${pmid}`
  }

  return `study-${slug(row['Paper title']).slice(0, 70)}`
}

// Build lookup table from All studies.
// We index by both PMID and title so papers without PMIDs still join.
const studyLookup = new Map()

for (const row of allStudyRows) {
  const pmid = clean(row['PMID'])
  const title = normalizeTitle(row['Paper title'])

  if (usable(pmid)) {
    studyLookup.set(`pmid:${pmid}`, row)
  }

  if (title) {
    studyLookup.set(`title:${title}`, row)
  }
}

function findStudy(peakRow) {
  const pmid = clean(peakRow['PMID'])

  if (usable(pmid)) {
    const byPmid = studyLookup.get(`pmid:${pmid}`)
    if (byPmid) return byPmid
  }

  const title = normalizeTitle(peakRow['Paper title'])

  if (title) {
    return studyLookup.get(`title:${title}`) ?? {}
  }

  return {}
}

const peaks = []

for (let index = 0; index < peakRows.length; index++) {
  const row = peakRows[index]

  const originalSpace = clean(row['Coordinate space'])

  // IMPORTANT:
  // For now we display only coordinates that were originally MNI.
  if (originalSpace.toUpperCase() !== 'MNI') continue

  const x = numeric(row['X coordinate'])
  const y = numeric(row['Y coordinate'])
  const z = numeric(row['Z coordinate'])

  if (x === null || y === null || z === null) continue

  const study = findStudy(row)

  const combined = {
    ...study,
    ...row,
  }

  const id = `${studyId(combined)}-peak-${index + 1}`

  peaks.push({
    id,
    studyId: studyId(combined),

    authors: clean(row['Authors']),
    year: numeric(row['Year']),
    title: clean(row['Paper title']),
journal: clean(row['Journal name']) || clean(study['Journal name']),    pmid: clean(row['PMID']),
    doi: clean(study['DOI']),

    // Preserve exactly what the paper reported.
    xOriginal: x,
    yOriginal: y,
    zOriginal: z,
    originalSpace,

    // Because this coordinate was already reported in MNI,
    // harmonization is the identity transformation.
    xMni: x,
    yMni: y,
    zMni: z,
    transformation: 'None — originally reported in MNI space',

    clusterNumber: clean(row['Cluster number (sequential)']),
    peakSource: clean(row['Peak source']),
    mapType: clean(row['Map type']),
    coordinateType: clean(row['Coordinate type']),
    hemisphere: clean(row['Hemisphere']),

    originalAnatomicalLabel: clean(row['Original anatomical label']),
    otherLabelsInCluster: clean(row['Other label(s) in same cluster']),

    contrast: clean(row['Contrast / comparison (as reported)']),
    groupsInContrast: clean(row['Groups in contrast']),
    nInContrast: clean(row['N in contrast']),
    direction: clean(row['Direction of effect']),

    clusterSize: clean(row['Cluster size']),
    clusterSizeUnit: clean(row['Cluster size unit']),

    software: clean(row['Software used (peaks)']),
    labellingMethod: clean(row['Labelling method']),
    searchSpace: clean(row['Search space']),
    smoothingFwhm: clean(row['Smoothing FWHM (mm)']),
    correctionMethod: clean(row['Multiple comparison correction method']),
    sourceInPaper: clean(row['Source in paper']),

    // Joined from All studies.
    claustrumFocus: clean(
      study['Primarily or secondarily claustrum'],
    ),
    centralAim: clean(study['Central analytical aim']),
    articleCategory: clean(study['Article category']),
    population: clean(study['Patients or HC?']),
    patientGroup: clean(study['Patient group(s)']),
    fieldStrength: clean(study['MRI field strength(s)']),
    modalities: clean(study['Modalities collected / analysed']),

    notes: clean(row['Notes']),
  })
}

const studyIds = new Set(peaks.map((peak) => peak.studyId))

const output = {
  displaySpace: 'MNI',
  status: 'Reported MNI coordinates only — Talairach harmonization pending',
  numberOfCoordinates: peaks.length,
  numberOfStudies: studyIds.size,
  peaks,
}

fs.mkdirSync(path.dirname(outputFile), {
  recursive: true,
})

fs.writeFileSync(
  outputFile,
  JSON.stringify(output, null, 2),
)

console.log('')
console.log('Claustrum Coordinates data built successfully.')
console.log(`MNI coordinates: ${peaks.length}`)
console.log(`Studies represented: ${studyIds.size}`)
console.log(`Saved to: ${outputFile}`)
console.log('')