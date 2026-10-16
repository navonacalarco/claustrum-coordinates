import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  comparePatientCategories, patientCategories, patientGroups,
  patientGroupOptions, matchesPatientCategory, matchesPatientGroup, retainPatientGroups,
} from '../src/components/patientFilters.ts'

const records = [
  { patientCategory: 'Psychiatric', patientGroup: 'Detailed cohort', patientGroupWebsite: 'Depression; Cannabis use' },
  { patientCategory: 'Psychiatric', patientGroup: 'Other cohort', patientGroupWebsite: 'Schizophrenia spectrum; Bipolar disorder' },
  { patientCategory: 'Neurological, Psychiatric', patientGroup: 'Mixed cohort', patientGroupWebsite: 'Stroke; Depression' },
  { patientCategory: 'Other clinical conditions', patientGroup: 'Other cohort', patientGroupWebsite: 'Renal disease' },
  { patientCategory: 'NA', patientGroup: 'NA', patientGroupWebsite: '' },
]

test('Other clinical conditions sorts last; other categories remain alphabetical', () => {
  assert.deepEqual(['Psychiatric', 'Other clinical conditions', 'Neurological'].sort(comparePatientCategories),
    ['Neurological', 'Psychiatric', 'Other clinical conditions'])
})

test('semicolon groups are independent, trimmed, unique website labels', () => {
  assert.deepEqual(patientGroups(records[0]), ['Depression', 'Cannabis use'])
  assert.deepEqual(patientGroups({ patientGroup: 'Do not use detailed cohort', patientGroupWebsite: ' Depression ; NA; Depression; NR; ' }), ['Depression'])
  assert.deepEqual(patientGroups({ patientGroup: 'Detailed cohort only' }), [])
})

test('category choice limits options and deduplicates mixed cohorts', () => {
  assert.deepEqual(patientGroupOptions(records, []), [])
  assert.deepEqual(patientGroupOptions(records, ['Psychiatric']),
    ['Bipolar disorder', 'Cannabis use', 'Depression', 'Schizophrenia spectrum', 'Stroke'])
  assert.deepEqual(patientCategories('Neurological, Psychiatric; NA'), ['Neurological', 'Psychiatric'])
})

test('either group in a mixed cohort matches; groups use OR within the category filter', () => {
  assert.equal(matchesPatientGroup(records[0], ['Cannabis use']), true)
  assert.equal(matchesPatientGroup(records[0], ['Depression']), true)
  assert.equal(matchesPatientGroup(records[0], ['Bipolar disorder']), false)
  const found = records.filter((record) =>
    matchesPatientCategory(record, ['Psychiatric']) &&
    matchesPatientGroup(record, ['Cannabis use', 'Bipolar disorder']))
  assert.deepEqual(found, records.slice(0, 2))
  assert.equal(matchesPatientGroup(records[4], ['Depression']), false)
})

test('changing or clearing categories removes unavailable group selections', () => {
  assert.deepEqual(retainPatientGroups(records, ['Neurological'], ['Depression', 'Cannabis use']), ['Depression'])
  assert.deepEqual(retainPatientGroups(records, [], ['Depression']), [])
})
