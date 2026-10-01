// Add future atlases here; each receives its own visibility and opacity controls.
export const atlasCatalog = [
  {
    id: 'bigbrain',
    label: 'BigBrain',
    description: 'Calarco et al. · Histology atlas · 0.5 mm',
    citationUrl: 'https://doi.org/10.1073/pnas.2604111123',
    filename: 'claustrum_BigBrainCalarco_ICBM2009symXiao_0p5mm.nii.gz',
    color: '#2dd4bf',
    rgb: [45, 212, 191],
  },
  {
    id: 'mauri',
    label: 'Mauri',
    description: 'Automatic template segmentation · 0.35 mm',
    citationUrl: 'https://github.com/chiara-mauri/claustrum_segmentation',
    filename: 'claustrum_Mauri_MNI2009b_sym_0p35mm.nii.gz',
    color: '#c4a0ff',
    rgb: [196, 160, 255],
  },
  {
    id: 'amygdala',
    label: 'Amygdala',
    description: 'Xiao et al. · ICBM2009 symmetric · 0.5 mm',
    citationUrl: 'https://doi.org/10.1038/s41597-019-0217-0',
    filename: 'amygdala_Xiao_ICBM2009sym_0p5mm.nii.gz',
    color: '#fbbf24',
    rgb: [251, 191, 36],
  },
  {
    id: 'putamen',
    label: 'Putamen',
    description: 'Xiao et al. · ICBM2009 symmetric · 0.5 mm',
    citationUrl: 'https://doi.org/10.1038/s41597-019-0217-0',
    filename: 'putamen_Xiao_ICBM2009sym_0p5mm.nii.gz',
    color: '#60a5fa',
    rgb: [96, 165, 250],
  },
] as const

export type AtlasDefinition = typeof atlasCatalog[number]
