type PatientRecord = {
  patientCategory?: string
  patientGroup: string
  patientGroupWebsite?: string
}

export function patientCategories(value: string = ''): string[] {
  return value.split(/[,;]/).map((part) => part.trim())
    .filter((part) => part !== '' && !['NA', 'NR'].includes(part.toUpperCase()))
}

export function matchesPatientCategory(peak: PatientRecord, selected: string[]): boolean {
  return selected.length === 0 ||
    patientCategories(peak.patientCategory).some((category) => selected.includes(category))
}

export function comparePatientCategories(a: string, b: string): number {
  const other = 'other clinical conditions'
  return Number(a.toLowerCase() === other) - Number(b.toLowerCase() === other) ||
    a.localeCompare(b)
}

// Website labels are separate study-level tags, not cohort-to-coordinate assignments.
export function patientGroups(peak: PatientRecord): string[] {
  return [...new Set((peak.patientGroupWebsite ?? '').split(';').map((part) => part.trim())
    .filter((part) => part !== '' && !['NA', 'NR'].includes(part.toUpperCase())))]
}

export function matchesPatientGroup(peak: PatientRecord, selected: string[]): boolean {
  return selected.length === 0 || patientGroups(peak).some((group) => selected.includes(group))
}

export function patientGroupOptions(peaks: PatientRecord[], selected: string[]): string[] {
  if (selected.length === 0) return []
  return [...new Set(peaks.filter((peak) => matchesPatientCategory(peak, selected))
    .flatMap(patientGroups))]
    .sort((a, b) => a.localeCompare(b))
}

export function retainPatientGroups(peaks: PatientRecord[], categories: string[], groups: string[]): string[] {
  const available = new Set(patientGroupOptions(peaks, categories))
  return groups.filter((group) => available.has(group))
}

