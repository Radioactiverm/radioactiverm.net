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
    this.currentWordIndex = 0
    this.currentCharIndex = 0
    this.isDeleting = false
    this.isInitial = true

    this.phrases = {
      en: {
        prefix: 'I build ',
        words: [
          'automation',
          'apps',
          'websites',
          'and the hardware that runs on it'
        ]
      },
      cs: {
        prefix: 'Tvořím ',
        words: [
          'automatizace',
          'aplikace',
          'weby',
          'a hardware, na kterém běží'
        ]
      }
    }

    this.start()
  }

  getLangData() {
    const lang = this.i18n?.currentLang === 'cs' ? 'cs' : 'en'
    return this.phrases[lang] || this.phrases.en
  }

  handleLangChange() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    this.isInitial = false
    this.isDeleting = false
    this.currentWordIndex = 0
    this.currentCharIndex = 0
    const data = this.getLangData()
    if (this.prefixEl) this.prefixEl.textContent = data.prefix
    if (this.textEl) this.textEl.textContent = ''
    this.tick()
  }

  start() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const data = this.getLangData()

    if (prefersReducedMotion) {
      if (this.prefixEl) this.prefixEl.textContent = data.prefix
      if (this.textEl) this.textEl.textContent = data.words.join(', ')
      if (this.cursorEl) this.cursorEl.style.display = 'none'
      return
    }

    if (this.prefixEl) this.prefixEl.textContent = ''
    if (this.textEl) this.textEl.textContent = ''

    this.timeoutId = setTimeout(() => {
      this.typeInitial()
    }, 400)
  }

  typeInitial() {
    const data = this.getLangData()
    const fullInitial = data.prefix + data.words[0]

    if (this.currentCharIndex < fullInitial.length) {
      this.currentCharIndex++
      const currentSub = fullInitial.slice(0, this.currentCharIndex)

      if (currentSub.length <= data.prefix.length) {
        if (this.prefixEl) this.prefixEl.textContent = currentSub
        if (this.textEl) this.textEl.textContent = ''
      } else {
        if (this.prefixEl) this.prefixEl.textContent = data.prefix
        if (this.textEl) this.textEl.textContent = currentSub.slice(data.prefix.length)
      }

      const speed = 70 + Math.random() * 25
      this.timeoutId = setTimeout(() => this.typeInitial(), speed)
    } else {
      if (this.prefixEl) this.prefixEl.textContent = data.prefix
      if (this.textEl) this.textEl.textContent = data.words[0]
      this.isInitial = false
      this.isDeleting = true
      this.currentCharIndex = data.words[0].length
      this.timeoutId = setTimeout(() => this.tick(), 1800)
    }
  }

  tick() {
    if (this.isDestroyed) return

    const data = this.getLangData()
    const word = data.words[this.currentWordIndex]

    if (this.prefixEl && this.prefixEl.textContent !== data.prefix) {
      this.prefixEl.textContent = data.prefix
    }

    if (this.isDeleting) {
      if (this.currentCharIndex > 0) {
        this.currentCharIndex--
        if (this.textEl) this.textEl.textContent = word.slice(0, this.currentCharIndex)
        const speed = 35 + Math.random() * 15
        this.timeoutId = setTimeout(() => this.tick(), speed)
      } else {
        this.isDeleting = false
        this.currentWordIndex = (this.currentWordIndex + 1) % data.words.length
        this.timeoutId = setTimeout(() => this.tick(), 350)
      }
    } else {
      if (this.currentCharIndex < word.length) {
        this.currentCharIndex++
        if (this.textEl) this.textEl.textContent = word.slice(0, this.currentCharIndex)
        const speed = 65 + Math.random() * 25
        this.timeoutId = setTimeout(() => this.tick(), speed)
      } else {
        this.isDeleting = true
        this.timeoutId = setTimeout(() => this.tick(), 1800)
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
