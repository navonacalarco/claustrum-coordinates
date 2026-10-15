type PatientRecord = {
  patientCategory?: string
  patientGroup: string
}

export function patientCategories(value: string = ''): string[] {
  return value.split(/[,;]/).map((part) => part.trim())
    .filter((part) => part !== '' && !['NA', 'NR'].includes(part.toUpperCase()))
}

export function matchesPatientCategory(peak: PatientRecord, selected: string[]): boolean {
  return selected.length === 0 ||
    patientCategories(peak.patientCategory).some((category) => selected.includes(category))
}

// Groups retain the spreadsheet wording; co-occurrence is not a diagnostic hierarchy.
export function patientGroupOptions(peaks: PatientRecord[], selected: string[]): string[] {
  return [...new Set(peaks.filter((peak) => matchesPatientCategory(peak, selected))
    .map((peak) => peak.patientGroup)
    .filter((group) => group.trim() !== '' && !['NA', 'NR'].includes(group.trim().toUpperCase())))]
    .sort((a, b) => a.localeCompare(b))
}

export function retainPatientGroups(peaks: PatientRecord[], categories: string[], groups: string[]): string[] {
  const available = new Set(patientGroupOptions(peaks, categories))
  return groups.filter((group) => available.has(group))
}
