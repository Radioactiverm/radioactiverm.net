export class InteractionsManager {
  constructor(i18n) {
    this.i18n = i18n
    this.topBar = document.getElementById('top-bar')
    this.toast = document.getElementById('toast')
    this.toastText = document.getElementById('toast-text')
    this.toastTimer = null

    this.initCardSpotlights()
    this.initRipples()
    this.initScrollReveals()
    this.initTopBarScroll()
    this.initCopyButtons()
    this.initLetterHover()
  }

  initCardSpotlights() {
    const handleMove = e => {
      const card = e.currentTarget
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      card.style.setProperty('--mx', `${x}px`)
      card.style.setProperty('--my', `${y}px`)
    }

    const cards = document.querySelectorAll('.card')
    cards.forEach(card => {
      card.addEventListener('pointermove', handleMove)
    })
  }

  initRipples() {
    document.addEventListener('pointerdown', e => {
      const target = e.target.closest('.ripple')
      if (!target) return

      const rect = target.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2

      const wave = document.createElement('span')
      wave.className = 'ripple-wave'
      wave.style.width = `${size}px`
      wave.style.height = `${size}px`
      wave.style.left = `${x}px`
      wave.style.top = `${y}px`

      target.appendChild(wave)

      const anim = wave.animate(
        [
          { transform: 'scale(0)', opacity: 0.28 },
          { transform: 'scale(1)', opacity: 0 }
        ],
        {
          duration: 480,
          easing: 'cubic-bezier(0.2, 0, 0, 1)'
        }
      )

      anim.onfinish = () => wave.remove()
    })
  }

  initScrollReveals() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px 80px 0px'
      }
    )

    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => observer.observe(el))

    setTimeout(() => {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
        el.classList.add('is-visible')
      })
    }, 600)
  }

  initTopBarScroll() {
    if (!this.topBar) return
    const update = () => {
      if (window.scrollY > 16) {
        this.topBar.classList.add('is-scrolled')
      } else {
        this.topBar.classList.remove('is-scrolled')
      }
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
  }

  initCopyButtons() {
    document.addEventListener('click', async e => {
      const btn = e.target.closest('[data-copy]')
      if (!btn) return
      const text = btn.dataset.copy
      if (!text) return

      try {
        await navigator.clipboard.writeText(text)
        const copiedMsg = this.i18n ? this.i18n.t('toast.copied') : 'Copied to clipboard'
        this.showToast(`${copiedMsg}: ${text}`)
      } catch {
        this.showToast(text)
      }
    })
  }

  showToast(message) {
    if (!this.toast || !this.toastText) return
    this.toastText.textContent = message
    this.toast.classList.add('is-open')

    if (this.toastTimer) {
      clearTimeout(this.toastTimer)
    }

    this.toastTimer = setTimeout(() => {
      this.toast.classList.remove('is-open')
    }, 2800)
  }

  initLetterHover() {
    const displayName = document.getElementById('display-name')
    if (!displayName) return
    if (displayName.querySelector('.letter')) return
    const rawText = (displayName.textContent || 'Radioactiverm').trim().replace(/\.$/, '')
    displayName.innerHTML = rawText
      .split('')
      .map((ch, idx) => `<span class="letter" style="--li:${idx}">${ch}</span>`)
      .join('') + '<span class="name-dot" aria-hidden="true">.</span>'
  }
}
