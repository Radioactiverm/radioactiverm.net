export class TypewriterManager {
  constructor(i18n) {
    this.i18n = i18n
    this.el = document.getElementById('profile-tagline')
    if (!this.el) return

    this.prefixEl = document.getElementById('typewriter-prefix')
    this.textEl = document.getElementById('typewriter-text')
    this.cursorEl = document.getElementById('typewriter-cursor')

    this.timeoutId = null
    this.isDestroyed = false
    this.currentIndex = 0
    this.phase = 'idle'

    this.phrases = {
      en: [
        { prefix: 'I build ', text: 'automation' },
        { prefix: 'I build ', text: 'apps' },
        { prefix: 'I build ', text: 'websites' },
        { prefix: 'And ', text: 'the hardware that runs it' }
      ],
      cs: [
        { prefix: 'Tvořím ', text: 'automatizace' },
        { prefix: 'Tvořím ', text: 'aplikace' },
        { prefix: 'Tvořím ', text: 'weby' },
        { prefix: 'A ', text: 'hardware, který to pohání' }
      ]
    }

    this.start()
  }

  getItems() {
    const lang = this.i18n?.currentLang === 'cs' ? 'cs' : 'en'
    return this.phrases[lang] || this.phrases.en
  }

  handleLangChange() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    this.currentIndex = 0
    if (this.prefixEl) this.prefixEl.textContent = ''
    if (this.textEl) this.textEl.textContent = ''
    this.phase = 'typing-prefix'
    this.tick()
  }

  start() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const items = this.getItems()

    if (prefersReducedMotion) {
      if (this.prefixEl) this.prefixEl.textContent = items[0].prefix
      if (this.textEl) this.textEl.textContent = items.map(i => (i.prefix ? '' : '— ') + i.text).join(', ')
      if (this.cursorEl) this.cursorEl.style.display = 'none'
      return
    }

    if (this.prefixEl) this.prefixEl.textContent = ''
    if (this.textEl) this.textEl.textContent = ''

    this.phase = 'typing-prefix'
    this.timeoutId = setTimeout(() => {
      this.tick()
    }, 400)
  }

  tick() {
    if (this.isDestroyed) return

    const items = this.getItems()
    const currentItem = items[this.currentIndex] || items[0]
    const nextIndex = (this.currentIndex + 1) % items.length
    const nextItem = items[nextIndex]

    if (this.phase === 'typing-prefix') {
      const cur = this.prefixEl ? this.prefixEl.textContent : ''
      if (cur.length < currentItem.prefix.length) {
        if (this.prefixEl) {
          this.prefixEl.textContent = currentItem.prefix.slice(0, cur.length + 1)
        }
        const speed = 70 + Math.random() * 20
        this.timeoutId = setTimeout(() => this.tick(), speed)
      } else {
        this.phase = 'typing-text'
        this.timeoutId = setTimeout(() => this.tick(), 50)
      }
    } else if (this.phase === 'typing-text') {
      const cur = this.textEl ? this.textEl.textContent : ''
      if (cur.length < currentItem.text.length) {
        if (this.textEl) {
          this.textEl.textContent = currentItem.text.slice(0, cur.length + 1)
        }
        const speed = 65 + Math.random() * 25
        this.timeoutId = setTimeout(() => this.tick(), speed)
      } else {
        this.phase = 'pausing'
        this.timeoutId = setTimeout(() => {
          this.phase = 'deleting-text'
          this.tick()
        }, 1800)
      }
    } else if (this.phase === 'deleting-text') {
      const cur = this.textEl ? this.textEl.textContent : ''
      if (cur.length > 0) {
        if (this.textEl) {
          this.textEl.textContent = cur.slice(0, -1)
        }
        const speed = 35 + Math.random() * 15
        this.timeoutId = setTimeout(() => this.tick(), speed)
      } else {
        if (nextItem.prefix !== currentItem.prefix) {
          this.phase = 'deleting-prefix'
          this.timeoutId = setTimeout(() => this.tick(), 50)
        } else {
          this.currentIndex = nextIndex
          this.phase = 'typing-text'
          this.timeoutId = setTimeout(() => this.tick(), 250)
        }
      }
    } else if (this.phase === 'deleting-prefix') {
      const cur = this.prefixEl ? this.prefixEl.textContent : ''
      if (cur.length > 0) {
        if (this.prefixEl) {
          this.prefixEl.textContent = cur.slice(0, -1)
        }
        const speed = 35 + Math.random() * 15
        this.timeoutId = setTimeout(() => this.tick(), speed)
      } else {
        this.currentIndex = nextIndex
        this.phase = 'typing-prefix'
        this.timeoutId = setTimeout(() => this.tick(), 250)
      }
    }
  }

  destroy() {
    this.isDestroyed = true
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }
}
