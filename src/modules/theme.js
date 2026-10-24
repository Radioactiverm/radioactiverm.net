import { seedPresets, schemeVariants } from '../data/palette.js'

function hexToRgb(hex) {
  let clean = hex.replace('#', '')
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('')
  }
  const num = parseInt(clean, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  }
}

function rgbToHex(r, g, b) {
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)))
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToRgb(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100

  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
  }
}

function toneToHex(h, s, tone) {
  const rgb = hslToRgb(h, s, tone)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

function generateM3Tokens(seedHex, isDark, variant = 'vibrant') {
  const { r, g, b } = hexToRgb(seedHex)
  const { h, s } = rgbToHsl(r, g, b)

  let primaryH = h
  let primaryS = Math.max(s, 60)

  let secondaryH = (h + 15) % 360
  let secondaryS = Math.max(25, s * 0.55)

  let tertiaryH = (h + 60) % 360
  let tertiaryS = Math.max(40, s * 0.75)

  if (variant === 'expressive') {
    secondaryH = (h + 40) % 360
    tertiaryH = (h + 120) % 360
    secondaryS = Math.min(85, s * 0.8)
    tertiaryS = Math.min(90, s * 0.9)
  } else if (variant === 'tonal') {
    primaryS = Math.min(primaryS, 45)
    secondaryS = Math.min(secondaryS, 20)
    tertiaryS = Math.min(tertiaryS, 30)
  }

  const neutralH = (h + 5) % 360
  const neutralS = isDark ? 8 : 12

  if (isDark) {
    return {
      '--md-sys-color-primary': toneToHex(primaryH, primaryS, 72),
      '--md-sys-color-on-primary': toneToHex(primaryH, primaryS, 18),
      '--md-sys-color-primary-container': toneToHex(primaryH, primaryS, 32),
      '--md-sys-color-on-primary-container': toneToHex(primaryH, primaryS, 88),
      '--md-sys-color-secondary': toneToHex(secondaryH, secondaryS, 75),
      '--md-sys-color-on-secondary': toneToHex(secondaryH, secondaryS, 18),
      '--md-sys-color-secondary-container': toneToHex(secondaryH, secondaryS, 28),
      '--md-sys-color-on-secondary-container': toneToHex(secondaryH, secondaryS, 86),
      '--md-sys-color-tertiary': toneToHex(tertiaryH, tertiaryS, 78),
      '--md-sys-color-on-tertiary': toneToHex(tertiaryH, tertiaryS, 20),
      '--md-sys-color-tertiary-container': toneToHex(tertiaryH, tertiaryS, 32),
      '--md-sys-color-on-tertiary-container': toneToHex(tertiaryH, tertiaryS, 90),
      '--md-sys-color-error': '#ff7351',
      '--md-sys-color-on-error': '#490900',
      '--md-sys-color-error-container': '#b92902',
      '--md-sys-color-on-error-container': '#ffd2c8',
      '--md-sys-color-background': toneToHex(neutralH, neutralS, 4),
      '--md-sys-color-on-background': toneToHex(neutralH, neutralS, 92),
      '--md-sys-color-surface': toneToHex(neutralH, neutralS, 4),
      '--md-sys-color-surface-dim': toneToHex(neutralH, neutralS, 4),
      '--md-sys-color-surface-bright': toneToHex(neutralH, neutralS, 18),
      '--md-sys-color-surface-container-lowest': '#000000',
      '--md-sys-color-surface-container-low': toneToHex(neutralH, neutralS, 6),
      '--md-sys-color-surface-container': toneToHex(neutralH, neutralS, 9),
      '--md-sys-color-surface-container-high': toneToHex(neutralH, neutralS, 12),
      '--md-sys-color-surface-container-highest': toneToHex(neutralH, neutralS, 16),
      '--md-sys-color-on-surface': toneToHex(neutralH, neutralS, 92),
      '--md-sys-color-surface-variant': toneToHex(neutralH, neutralS, 16),
      '--md-sys-color-on-surface-variant': toneToHex(neutralH, neutralS, 68),
      '--md-sys-color-outline': toneToHex(neutralH, neutralS, 45),
      '--md-sys-color-outline-variant': toneToHex(neutralH, neutralS, 24),
      '--md-sys-color-inverse-surface': toneToHex(neutralH, neutralS, 92),
      '--md-sys-color-inverse-on-surface': toneToHex(neutralH, neutralS, 16),
      '--md-sys-color-inverse-primary': toneToHex(primaryH, primaryS, 32),
      '--md-sys-color-primary-fixed': toneToHex(primaryH, primaryS, 72),
      '--md-sys-color-primary-fixed-dim': toneToHex(primaryH, primaryS, 64),
      '--md-sys-color-on-primary-fixed': toneToHex(primaryH, primaryS, 14),
      '--md-sys-color-tertiary-fixed': toneToHex(tertiaryH, tertiaryS, 78),
      '--md-sys-color-on-tertiary-fixed': toneToHex(tertiaryH, tertiaryS, 16),
      '--md-sys-color-success': '#7ee08a',
      '--md-sys-color-warning': '#f8d660'
    }
  }

  return {
    '--md-sys-color-primary': toneToHex(primaryH, primaryS, 32),
    '--md-sys-color-on-primary': '#ffffff',
    '--md-sys-color-primary-container': toneToHex(primaryH, primaryS, 85),
    '--md-sys-color-on-primary-container': toneToHex(primaryH, primaryS, 18),
    '--md-sys-color-secondary': toneToHex(secondaryH, secondaryS, 36),
    '--md-sys-color-on-secondary': '#ffffff',
    '--md-sys-color-secondary-container': toneToHex(secondaryH, secondaryS, 86),
    '--md-sys-color-on-secondary-container': toneToHex(secondaryH, secondaryS, 20),
    '--md-sys-color-tertiary': toneToHex(tertiaryH, tertiaryS, 34),
    '--md-sys-color-on-tertiary': '#ffffff',
    '--md-sys-color-tertiary-container': toneToHex(tertiaryH, tertiaryS, 88),
    '--md-sys-color-on-tertiary-container': toneToHex(tertiaryH, tertiaryS, 18),
    '--md-sys-color-error': '#be2d06',
    '--md-sys-color-on-error': '#ffffff',
    '--md-sys-color-error-container': '#ffd2c8',
    '--md-sys-color-on-error-container': '#520c00',
    '--md-sys-color-background': toneToHex(neutralH, neutralS, 98),
    '--md-sys-color-on-background': toneToHex(neutralH, neutralS, 12),
    '--md-sys-color-surface': toneToHex(neutralH, neutralS, 98),
    '--md-sys-color-surface-dim': toneToHex(neutralH, neutralS, 86),
    '--md-sys-color-surface-bright': toneToHex(neutralH, neutralS, 98),
    '--md-sys-color-surface-container-lowest': '#ffffff',
    '--md-sys-color-surface-container-low': toneToHex(neutralH, neutralS, 94),
    '--md-sys-color-surface-container': toneToHex(neutralH, neutralS, 91),
    '--md-sys-color-surface-container-high': toneToHex(neutralH, neutralS, 88),
    '--md-sys-color-surface-container-highest': toneToHex(neutralH, neutralS, 84),
    '--md-sys-color-on-surface': toneToHex(neutralH, neutralS, 12),
    '--md-sys-color-surface-variant': toneToHex(neutralH, neutralS, 84),
    '--md-sys-color-on-surface-variant': toneToHex(neutralH, neutralS, 35),
    '--md-sys-color-outline': toneToHex(neutralH, neutralS, 48),
    '--md-sys-color-outline-variant': toneToHex(neutralH, neutralS, 72),
    '--md-sys-color-inverse-surface': toneToHex(neutralH, neutralS, 10),
    '--md-sys-color-inverse-on-surface': toneToHex(neutralH, neutralS, 90),
    '--md-sys-color-inverse-primary': toneToHex(primaryH, primaryS, 72),
    '--md-sys-color-primary-fixed': toneToHex(primaryH, primaryS, 85),
    '--md-sys-color-primary-fixed-dim': toneToHex(primaryH, primaryS, 78),
    '--md-sys-color-on-primary-fixed': toneToHex(primaryH, primaryS, 16),
    '--md-sys-color-tertiary-fixed': toneToHex(tertiaryH, tertiaryS, 88),
    '--md-sys-color-on-tertiary-fixed': toneToHex(tertiaryH, tertiaryS, 18),
    '--md-sys-color-success': '#1f8a3a',
    '--md-sys-color-warning': '#a66b00'
  }
}

export class ThemeManager {
  constructor() {
    this.root = document.documentElement
    this.themeToggleBtn = document.getElementById('theme-toggle')
    this.themeIcon = document.getElementById('theme-toggle-icon')
    this.swatchesContainer = document.getElementById('swatches')
    this.variantContainer = document.getElementById('variant-chips')
    this.seedReadout = document.getElementById('seed-readout')
    this.toneStrip = document.getElementById('tone-strip')
    this.metaThemeColor = document.querySelector('meta[name="theme-color"]')

    const saved = this.loadSettings()
    this.mode = saved.mode || 'dark'
    this.seed = saved.seed || '#7dcd53'
    this.variant = saved.variant || 'vibrant'

    this.renderControls()
    this.applyTheme(false)
    this.bindEvents()
  }

  loadSettings() {
    try {
      return JSON.parse(localStorage.getItem('rm:theme') || '{}')
    } catch {
      return {}
    }
  }

  saveSettings(tokens) {
    try {
      localStorage.setItem(
        'rm:theme',
        JSON.stringify({
          mode: this.mode,
          seed: this.seed,
          variant: this.variant,
          tokens
        })
      )
    } catch {}
  }

  applyTheme(animated = true) {
    const isDark = this.mode === 'dark'
    const tokens = generateM3Tokens(this.seed, isDark, this.variant)

    const updateDom = () => {
      this.root.dataset.theme = this.mode
      for (const [key, val] of Object.entries(tokens)) {
        this.root.style.setProperty(key, val)
      }
      if (this.metaThemeColor) {
        this.metaThemeColor.setAttribute('content', tokens['--md-sys-color-surface-dim'])
      }
      if (this.themeIcon) {
        this.themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode'
      }
      if (this.seedReadout) {
        this.seedReadout.textContent = this.seed.toUpperCase()
      }
      this.updateToneStrip(tokens)
      this.updateActiveSwatches()
    }

    if (animated && document.startViewTransition && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      document.startViewTransition(updateDom)
    } else {
      updateDom()
    }

    this.saveSettings(tokens)
  }

  updateToneStrip(tokens) {
    if (!this.toneStrip) return
    const primary = tokens['--md-sys-color-primary']
    const container = tokens['--md-sys-color-primary-container']
    const secondary = tokens['--md-sys-color-secondary']
    const tertiary = tokens['--md-sys-color-tertiary']
    const surface = tokens['--md-sys-color-surface-container-high']
    this.toneStrip.innerHTML = [primary, container, secondary, tertiary, surface]
      .map(color => `<span style="background:${color}"></span>`)
      .join('')
  }

  updateActiveSwatches() {
    if (this.swatchesContainer) {
      const buttons = this.swatchesContainer.querySelectorAll('.swatch:not(.swatch-custom)')
      buttons.forEach(btn => {
        const hex = btn.dataset.hex
        const isActive = hex.toLowerCase() === this.seed.toLowerCase()
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false')
      })
    }
    if (this.variantContainer) {
      const chips = this.variantContainer.querySelectorAll('.chip-filter')
      chips.forEach(chip => {
        const isActive = chip.dataset.variant === this.variant
        chip.setAttribute('aria-pressed', isActive ? 'true' : 'false')
      })
    }
  }

  renderControls() {
    if (this.swatchesContainer) {
      const swatchesHtml = seedPresets
        .map(
          item => `
        <button type="button" class="swatch sl ripple" data-hex="${item.hex}" title="${item.name}" aria-label="${item.name}" aria-pressed="${item.hex.toLowerCase() === this.seed.toLowerCase() ? 'true' : 'false'}" style="--swatch:${item.hex}"></button>
      `
        )
        .join('')

      const customHtml = `
        <label class="swatch swatch-custom sl ripple" title="Custom color" aria-label="Custom color picker">
          <span class="ms" aria-hidden="true">colorize</span>
          <input type="color" id="custom-color-input" value="${this.seed}" />
        </label>
      `
      this.swatchesContainer.innerHTML = swatchesHtml + customHtml
    }

    if (this.variantContainer) {
      this.variantContainer.innerHTML = schemeVariants
        .map(
          v => `
        <button type="button" class="chip chip-filter sl ripple" data-variant="${v.id}" aria-pressed="${v.id === this.variant ? 'true' : 'false'}">
          <span class="ms chip-check" aria-hidden="true">check</span>
          <span>${v.label}</span>
        </button>
      `
        )
        .join('')
    }
  }

  bindEvents() {
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => {
        this.mode = this.mode === 'dark' ? 'light' : 'dark'
        this.applyTheme(true)
      })
    }

    if (this.swatchesContainer) {
      this.swatchesContainer.addEventListener('click', e => {
        const btn = e.target.closest('.swatch[data-hex]')
        if (!btn) return
        this.seed = btn.dataset.hex
        this.applyTheme(true)
      })

      const customInput = document.getElementById('custom-color-input')
      if (customInput) {
        customInput.addEventListener('input', e => {
          this.seed = e.target.value
          this.applyTheme(false)
        })
      }
    }

    if (this.variantContainer) {
      this.variantContainer.addEventListener('click', e => {
        const chip = e.target.closest('.chip-filter[data-variant]')
        if (!chip) return
        this.variant = chip.dataset.variant
        this.applyTheme(true)
      })
    }
  }
}
