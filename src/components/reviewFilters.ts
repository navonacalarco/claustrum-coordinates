export type ReviewLabels = {
  ageGroupWebsite?: string
  articleCategoryWebsite?: string
  contrastCategoryWebsite?: string
}

export function reviewTags(value = ''): string[] {
  const tags = value.split(';').map(v => v.trim()).filter(Boolean).map(v =>
    v === 'NR' ? 'Not reported' : v === 'NA' ? 'Not applicable' : v)
  return [...new Set(tags)]
}

export function matchesTags(value: string | undefined, selected: string[]): boolean {
  return selected.length === 0 || reviewTags(value).some(tag => selected.includes(tag))
}

export function matchesReviewLabels(peak: ReviewLabels, filters: {
  ageGroup: string[]; studyDesign: string[]; taskDomain: string[]
}): boolean {
  return matchesTags(peak.ageGroupWebsite, filters.ageGroup) &&
    matchesTags(peak.articleCategoryWebsite, filters.studyDesign) &&
    matchesTags(peak.contrastCategoryWebsite, filters.taskDomain)
}

const ageOrder = ['Fetal', 'Preterm', 'Infants', 'Children', 'Adolescents', 'Adults', 'Older adults']
export function labelOptions(values: (string | undefined)[], age = false): string[] {
  const order = (v: string) => {
    if (v === 'Not applicable') return 100
    if (v === 'Not reported' || v === 'Unclear / not reported') return 99
    if (v === 'Other tasks') return 98
    return age && ageOrder.includes(v) ? ageOrder.indexOf(v) : 50
  }
  return [...new Set(values.flatMap(v => reviewTags(v)))].sort((a, b) =>
    order(a) - order(b) || a.localeCompare(b))
}

export function compareFilterLabels(a: string, b: string): number {
  const rank = (value: string) => /^(na|n\/a|nr|not applicable|not reported|unknown|unclear)(\b|$)/i.test(value.trim()) ? 2
    : /^other(\b|$)/i.test(value.trim()) ? 1 : 0
  return rank(a) - rank(b) || a.localeCompare(b)
}
