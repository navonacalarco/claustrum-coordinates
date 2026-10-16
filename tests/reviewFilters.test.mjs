import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import { reviewTags, labelOptions, matchesReviewLabels, compareFilterLabels } from '../src/components/reviewFilters.ts'

const empty = { ageGroup: [], studyDesign: [], taskDomain: [] }
const classifications = JSON.parse(fs.readFileSync(new URL('../public/data/peak-classifications.json', import.meta.url)))
const peaks = JSON.parse(fs.readFileSync(new URL('../public/data/peaks-mni.json', import.meta.url))).peaks.map(p => ({ ...p, ...classifications[p.id] }))

test('task filter retains only matching contrasts in a multi-domain study', () => {
  // Yan's word main effect and inhibition interaction have distinct domain labels.
  const study = peaks.filter(p => p.pmid === '28803349')
  assert.equal(study.length, 2)
  const selected = study.filter(p => matchesReviewLabels(p, { ...empty, taskDomain: ['Attention / cognitive control'] }))
  assert.equal(selected.length, 1)
  assert.match(selected[0].contrast, /interaction/)
  assert.equal(study.filter(p => matchesReviewLabels(p, { ...empty, taskDomain: ['Language / speech'] })).length, 2)
})

test('multiple tags use OR within a filter and AND across filters; reset retains all', () => {
  const p = { ageGroupWebsite: 'Children; Adolescents', articleCategoryWebsite: 'Observational: association', contrastCategoryWebsite: 'Emotion; Memory / learning' }
  assert.equal(matchesReviewLabels(p, { ageGroup: ['Adults', 'Adolescents'], studyDesign: [], taskDomain: ['Memory / learning'] }), true)
  assert.equal(matchesReviewLabels(p, { ageGroup: ['Adults'], studyDesign: [], taskDomain: ['Emotion'] }), false)
  assert.equal(matchesReviewLabels(p, { ...empty, studyDesign: ['Intervention'] }), false)
  assert.equal(peaks.filter(p => matchesReviewLabels(p, empty)).length, peaks.length)
})

test('age options are chronological, and missing/non-task labels remain selectable', () => {
  assert.deepEqual(labelOptions(['Adults; Older adults', 'NR', 'Fetal; Infants', 'Children', 'NA'], true),
    ['Fetal', 'Infants', 'Children', 'Adults', 'Older adults', 'Not reported', 'Not applicable'])
  assert.deepEqual(reviewTags(' Emotion; Memory / learning; Emotion '), ['Emotion', 'Memory / learning'])
  assert.equal(matchesReviewLabels({ contrastCategoryWebsite: 'Not applicable' }, { ...empty, taskDomain: ['Emotion'] }), false)
})

test('all displayed peaks have complete labels and finite MNI coordinates', () => {
  assert.equal(peaks.length, new Set(peaks.map(p => p.id)).size)
  for (const p of peaks) {
    assert.ok(p.ageGroupWebsite && p.articleCategoryWebsite && p.contrastCategoryWebsite)
    assert.equal(p.originalSpace, 'MNI')
    assert.ok([p.xMni, p.yMni, p.zMni].every(Number.isFinite))
  }
})

test('generic dropdowns put Other and missing-value equivalents last', () => {
  assert.deepEqual(['Other', 'VBM', 'NA', 'ASL', 'Not reported', 'task-fMRI'].sort(compareFilterLabels),
    ['ASL', 'task-fMRI', 'VBM', 'Other', 'NA', 'Not reported'])
})
