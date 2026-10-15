export type AtlasStructure = 'Claustrum' | 'Insula' | 'Putamen' | 'Amygdala'

export type AtlasDefinition = {
  id: string
  structure: AtlasStructure
  label: string
  description: string
  filename: string
  color: string
  resolution: string
  provenance: string
  links: { label: string; url: string }[]
}

export const atlasStructures: AtlasStructure[] = ['Claustrum', 'Insula', 'Putamen', 'Amygdala']

// Default colours: Darjeeling1, with GrandBudapest1 coral for amygdala (karthik/wesanderson).
// Add future labels here. Each has independent visibility, colour and opacity.
export const atlasCatalog: AtlasDefinition[] = [
  {
    id: 'bigbrain',
    structure: 'Claustrum',
    label: 'Calarco',
    description: 'Claustrum atlas (BigBrain)',
    filename: 'claustrum_BigBrainCalarco_ICBM2009symXiao_0p5mm_manuallyRevised.nii.gz',
    color: '#F2AD00',
    resolution: '0.5 mm',
    provenance: 'BigBrain histology segmentation from Calarco et al., transformed to MNI space using the Xiao registration, resampled to 0.5 mm, and manually refined.',
    links: [
      { label: 'Calarco et al. · PNAS, 2026', url: 'https://doi.org/10.1073/pnas.2604111123' },
      { label: 'Xiao registration paper', url: 'https://doi.org/10.1038/s41597-019-0217-0' },
    ],
  },
  {
    id: 'mauri',
    structure: 'Claustrum',
    label: 'Mauri',
    description: 'Claustrum automated segmentation (FreeSurfer)',
    filename: 'claustrum_Mauri_MNI2009b_sym_0p5mm.nii.gz',
    color: '#00A08A',
    resolution: '0.5 mm',
    provenance: 'Automatic segmentation of the ICBM2009b symmetric template using Mauri et al.’s method. Left and right outputs were combined at 0.35 mm, then resampled to 0.5 mm using nearest-neighbour interpolation.',
    links: [
      { label: 'Code & model', url: 'https://github.com/chiara-mauri/claustrum_segmentation' },
      { label: 'Mauri et al. · Human Brain Mapping, 2025', url: 'https://doi.org/10.1002/hbm.70303' },
    ],
  },
  {
    id: 'insula',
    structure: 'Insula',
    label: 'Allen AHRAv2',
    description: 'Human Reference Atlas v2',
    filename: 'insula_Allen_AHRAv2_ICBM2009sym_0p5mm.nii.gz',
    color: '#5BBCD6',
    resolution: '0.5 mm',
    provenance: 'Insula label extracted from the Allen Human Reference Atlas 3D, version 2 (AHRAv2).',
    links: [
      { label: 'Allen atlas & source data', url: 'https://alleninstitute.github.io/CCF-MAP/descriptions/human_ccf.html' },
    ],
  },
  {
    id: 'putamen',
    structure: 'Putamen',
    label: 'Xiao',
    description: 'Subcortical atlas',
    filename: 'putamen_Xiao_ICBM2009sym_0p5mm.nii.gz',
    color: '#F98400',
    resolution: '0.5 mm',
    provenance: 'Putamen label extracted from Xiao et al.’s subcortical atlas.',
    links: [
      { label: 'Xiao et al. · Scientific Data, 2019', url: 'https://doi.org/10.1038/s41597-019-0217-0' },
    ],
  },
  {
    id: 'amygdala',
    structure: 'Amygdala',
    label: 'Xiao',
    description: 'Subcortical atlas',
    filename: 'amygdala_Xiao_ICBM2009sym_0p5mm.nii.gz',
    color: '#FD6467',
    resolution: '0.5 mm',
    provenance: 'Amygdala label extracted from Xiao et al.’s subcortical atlas.',
    links: [
      { label: 'Xiao et al. · Scientific Data, 2019', url: 'https://doi.org/10.1038/s41597-019-0217-0' },
    ],
  },
]

