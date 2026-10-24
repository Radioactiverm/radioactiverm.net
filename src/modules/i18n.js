import { translations } from '../data/i18n.js'

export class I18nManager {
  constructor() {
    this.root = document.documentElement
    this.currentLang = localStorage.getItem('rm:lang') || 'en'
    if (!translations[this.currentLang]) {
      this.currentLang = 'en'
    }

    this.langSwitch = document.getElementById('lang-switch')
    this.btnEn = document.getElementById('lang-en')
    this.btnCs = document.getElementById('lang-cs')
    this.listeners = []

    this.bindEvents()
    this.applyLanguage(this.currentLang, false)
  }

  t(key) {
    const dict = translations[this.currentLang] || translations.en
    return dict[key] || translations.en[key] || key
  }

  onChange(callback) {
    this.listeners.push(callback)
  }

  setLanguage(lang) {
    if (this.currentLang === lang) return
    this.applyLanguage(lang, true)
  }

  applyLanguage(lang, notify = true) {
    this.currentLang = lang
    this.root.lang = lang
    try {
      localStorage.setItem('rm:lang', lang)
    } catch {}

    const isEn = lang === 'en'
    if (this.langSwitch) {
      this.langSwitch.style.setProperty('--active', isEn ? '0' : '1')
    }
    if (this.btnEn) {
      this.btnEn.setAttribute('aria-pressed', isEn ? 'true' : 'false')
    }
    if (this.btnCs) {
      this.btnCs.setAttribute('aria-pressed', !isEn ? 'true' : 'false')
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n
      el.textContent = this.t(key)
    })

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml
      el.innerHTML = this.t(key)
    })

    document.querySelectorAll('[data-i18n-label]').forEach(el => {
      const key = el.dataset.i18nLabel
      el.setAttribute('aria-label', this.t(key))
    })

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle
      el.setAttribute('title', this.t(key))
    })

    if (notify) {
      this.listeners.forEach(fn => fn(lang))
    }
  }

  bindEvents() {
    if (this.btnEn) {
      this.btnEn.addEventListener('click', () => this.setLanguage('en'))
    }
    if (this.btnCs) {
      this.btnCs.addEventListener('click', () => this.setLanguage('cs'))
    }
  }
}
