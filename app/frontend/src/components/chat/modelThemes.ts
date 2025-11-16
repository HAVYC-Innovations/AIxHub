const clamp = (value: number) => Math.max(0, Math.min(255, value))

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized
  const bigint = Number.parseInt(value, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((channel) => clamp(channel).toString(16).padStart(2, '0'))
    .join('')}`

const adjustHex = (hex: string, amount: number) => {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r + amount, g + amount, b + amount)
}

const toRgba = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export type ThemeId = 'general' | 'crimson' | 'emerald' | 'violet' | 'custom'

export type ThemePalette = {
  id: ThemeId
  label: string
  background: string
  chatPanel: string
  composerPanel: string
  border: string
  accentFrom: string
  accentTo: string
  pillBg: string
  pillText: string
  mutedText: string
}

export type ModelDefinition = {
  id: string
  name: string
  summary: string
  accentHex: string
  themeId: ThemeId
}

const buildBackground = (baseHex: string) => {
  const highlight = toRgba(adjustHex(baseHex, 80), 0.3)
  return `radial-gradient(circle at 20% -10%, ${highlight}, #02030a 70%)`
}

export const buildThemeFromHex = (hex: string): ThemePalette => {
  const accentFrom = adjustHex(hex, 15)
  const accentTo = adjustHex(hex, -25)
  return {
    id: 'custom',
    label: 'Personalizado',
    background: buildBackground(hex),
    chatPanel: toRgba('#03050b', 0.92),
    composerPanel: toRgba('#020307', 0.95),
    border: toRgba(adjustHex(hex, 60), 0.25),
    accentFrom,
    accentTo,
    pillBg: toRgba(adjustHex(hex, -40), 0.35),
    pillText: '#f8fbff',
    mutedText: '#97a0c0',
  }
}

const buildPresetTheme = (id: ThemeId, label: string, hex: string): ThemePalette => ({
  ...buildThemeFromHex(hex),
  id,
  label,
})

export const THEME_PRESETS: Record<Exclude<ThemeId, 'custom'>, ThemePalette> = {
  general: buildPresetTheme('general', 'AIx General', '#3b82f6'),
  crimson: buildPresetTheme('crimson', 'Revenue Crimson', '#f43f5e'),
  emerald: buildPresetTheme('emerald', 'Ops Emerald', '#10b981'),
  violet: buildPresetTheme('violet', 'Vision Violet', '#a855f7'),
}

export const MODEL_LIBRARY: ModelDefinition[] = [
  {
    id: 'general',
    name: 'AIx General',
    summary: 'Modelo base entrenado con contexto común del workspace.',
    accentHex: '#3b82f6',
    themeId: 'general',
  },
  {
    id: 'revenue',
    name: 'Revenue Torch',
    summary: 'Pitch decks y playbooks comerciales cargados manualmente.',
    accentHex: '#f43f5e',
    themeId: 'crimson',
  },
  {
    id: 'operations',
    name: 'Ops Sage',
    summary: 'Documentación operativa y de producto.',
    accentHex: '#10b981',
    themeId: 'emerald',
  },
  {
    id: 'vision',
    name: 'Vision Flux',
    summary: 'Historias visuales y materiales creativos personalizados.',
    accentHex: '#a855f7',
    themeId: 'violet',
  },
  {
    id: 'custom',
    name: 'Personalizado',
    summary: 'Sincroniza la interfaz con el color de tu marca.',
    accentHex: '#3b82f6',
    themeId: 'custom',
  },
]

export const DEFAULT_MODEL_ID = 'general'

export const getModelPalette = (model: ModelDefinition, customHex?: string): ThemePalette => {
  if (model.themeId === 'custom' && customHex) {
    return { ...buildThemeFromHex(customHex), id: 'custom', label: 'Personalizado' }
  }

  if (model.themeId !== 'custom') {
    return THEME_PRESETS[model.themeId]
  }

  return buildThemeFromHex(model.accentHex)
}
