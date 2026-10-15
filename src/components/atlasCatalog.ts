export type AtlasStructure = 'Claustrum' | 'Insula' | 'Putamen' | 'Amygdala'

export type AtlasDefinition = {
  id: string
  structure: AtlasStructure
  label: string
  filename: string
  color: string
  resolution: string
  provenance: string
  links: { label: string; url: string }[]
}

export const atlasStructures: AtlasStructure[] = ['Claustrum', 'Insula', 'Putamen', 'Amygdala']

// Add future labels here. Each has independent visibility, colour and opacity.
export const atlasCatalog: AtlasDefinition[] = [
  {
    id: 'bigbrain',
    structure: 'Claustrum',
    label: 'Calarco',
    filename: 'claustrum_BigBrainCalarco_ICBM2009symXiao_0p5mm_manuallyRevised.nii.gz',
    color: '#facc15',
    resolution: '0.5 mm',
    provenance: 'BigBrain histology segmentation from Calarco et al., transformed to ICBM2009 symmetric space using the Xiao registration, resampled to 0.5 mm isotropic voxels, and manually refined in MNI space. The displayed overlay and download both use this manually refined version.',
    links: [
      { label: 'Calarco et al. · PNAS, 2026', url: 'https://doi.org/10.1073/pnas.2604111123' },
      { label: 'Xiao registration paper', url: 'https://doi.org/10.1038/s41597-019-0217-0' },
    ],
  },
  {
    id: 'mauri',
    structure: 'Claustrum',
    label: 'Mauri',
    filename: 'claustrum_Mauri_MNI2009b_sym_0p35mm.nii.gz',
    color: '#4ade80',
    resolution: '0.35 mm',
    provenance: 'Automatic segmentation of the ICBM2009b symmetric template using Mauri et al.’s method. Left and right outputs were combined on a shared 0.35 mm grid.',
    links: [
      { label: 'Code & model', url: 'https://github.com/chiara-mauri/claustrum_segmentation' },
      { label: 'Mauri et al. · Human Brain Mapping, 2025', url: 'https://doi.org/10.1002/hbm.70303' },
    ],
  },
  {
    id: 'insula',
    structure: 'Insula',
    label: 'Allen AHRAv2',
    filename: 'insula_Allen_AHRAv2_ICBM2009sym_0p5mm.nii.gz',
    color: '#f472b6',
    resolution: '0.5 mm',
    provenance: 'Insula label extracted from the Allen Human Reference Atlas 3D, version 2 (AHRAv2), in ICBM2009b symmetric space.',
    links: [
      { label: 'Allen atlas & source data', url: 'https://alleninstitute.github.io/CCF-MAP/descriptions/human_ccf.html' },
    ],
  },
  {
    id: 'putamen',
    structure: 'Putamen',
    label: 'Xiao',
    filename: 'putamen_Xiao_ICBM2009sym_0p5mm.nii.gz',
    color: '#60a5fa',
    resolution: '0.5 mm',
    provenance: 'Putamen label extracted from Xiao et al.’s subcortical segmentation of the ICBM2009b symmetric template.',
    links: [
      { label: 'Xiao et al. · Scientific Data, 2019', url: 'https://doi.org/10.1038/s41597-019-0217-0' },
    ],
  },
  {
    id: 'amygdala',
    structure: 'Amygdala',
    label: 'Xiao',
    filename: 'amygdala_Xiao_ICBM2009sym_0p5mm.nii.gz',
    color: '#c4a0ff',
    resolution: '0.5 mm',
    provenance: 'Amygdala label extracted from Xiao et al.’s subcortical segmentation of the ICBM2009b symmetric template.',
    links: [
      { label: 'Xiao et al. · Scientific Data, 2019', url: 'https://doi.org/10.1038/s41597-019-0217-0' },
    ],
  },
]
