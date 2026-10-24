export class MusicPlayer {
  constructor(i18n) {
    this.i18n = i18n
    this.card = document.getElementById('card-player')
    this.trackIndexEl = document.getElementById('track-index')
    this.cover = document.getElementById('cover')
    this.coverImg = document.getElementById('cover-img')
    this.trackTitle = document.getElementById('track-title')
    this.wavy = document.getElementById('wavy')
    this.wavySvg = document.getElementById('wavy-svg')
    this.wavyActive = document.getElementById('wavy-active')
    this.wavyTrack = document.getElementById('wavy-track')
    this.wavyStop = document.getElementById('wavy-stop')
    this.timeCurrent = document.getElementById('time-current')
    this.timeTotal = document.getElementById('time-total')
    this.btnPrev = document.getElementById('btn-prev')
    this.btnPlay = document.getElementById('btn-play')
    this.playIcon = document.getElementById('play-icon')
    this.btnNext = document.getElementById('btn-next')
    this.btnMute = document.getElementById('btn-mute')
    this.volumeIcon = document.getElementById('volume-icon')
    this.volumeSlider = document.getElementById('volume-slider')
    this.volumeVal = document.getElementById('volume-val')
    this.audio = document.getElementById('audio')

    this.playlist = []
    this.currentIndex = 0
    this.isPlaying = false
    this.phase = 0
    this.animFrameId = null
    this.coverUrl = null
    this.savedVolume = 0.8

    this.init()
  }

  async init() {
    this.initVolume()
    this.bindEvents()
    await this.loadPlaylist()
  }

  initVolume() {
    let vol = 0.8
    try {
      const stored = localStorage.getItem('rm:player:volume')
      if (stored !== null && !isNaN(Number(stored))) {
        vol = Math.max(0, Math.min(1, Number(stored)))
      }
    } catch {}
    this.savedVolume = vol > 0 ? vol : 0.8
    this.setVolume(vol, false)
  }

  setVolume(val, persist = true) {
    const clamped = Math.max(0, Math.min(1, Number(val)))
    if (this.audio) {
      this.audio.volume = clamped
    }
    if (this.volumeSlider) {
      this.volumeSlider.value = clamped.toString()
      this.volumeSlider.style.setProperty('--volume-pct', `${Math.round(clamped * 100)}%`)
    }
    if (this.volumeVal) {
      this.volumeVal.textContent = `${Math.round(clamped * 100)}%`
    }
    if (this.volumeIcon) {
      if (clamped === 0) {
        this.volumeIcon.textContent = 'volume_off'
      } else if (clamped < 0.5) {
        this.volumeIcon.textContent = 'volume_down'
      } else {
        this.volumeIcon.textContent = 'volume_up'
      }
    }
    if (clamped > 0) {
      this.savedVolume = clamped
    }
    if (persist) {
      try {
        localStorage.setItem('rm:player:volume', clamped.toString())
      } catch {}
    }
  }

  toggleMute() {
    if (!this.audio) return
    if (this.audio.volume > 0) {
      this.savedVolume = this.audio.volume
      this.setVolume(0)
    } else {
      this.setVolume(this.savedVolume || 0.8)
    }
  }

  async loadPlaylist() {
    try {
      const res = await fetch('/music/files.json', { cache: 'no-store' })
      if (!res.ok) throw new Error('files.json not found')
      const files = await res.json()
      if (Array.isArray(files) && files.length > 0) {
        this.playlist = files
        this.loadTrack(0, false)
      } else {
        this.setTrackTitle('No music available')
      }
    } catch {
      this.playlist = [
        'фруктовый 1.0.m4a',
        'Cachalot (Slowed).opus',
        'ex-freundin (slowed + instrumental).opus',
        'superswag pt. 1.opus',
        'vlone (slowed).opus'
      ]
      this.loadTrack(0, false)
    }
  }

  cleanTrackName(filename) {
    return filename.replace(/\.[^/.]+$/, '')
  }

  setTrackTitle(text) {
    if (this.trackTitle) {
      this.trackTitle.textContent = text
    }
  }

  loadTrack(index, autoPlay = true) {
    if (this.playlist.length === 0) return
    this.currentIndex = (index + this.playlist.length) % this.playlist.length
    const file = this.playlist[this.currentIndex]

    if (this.trackIndexEl) {
      const currentPad = String(this.currentIndex + 1).padStart(2, '0')
      const totalPad = String(this.playlist.length).padStart(2, '0')
      this.trackIndexEl.textContent = `${currentPad}/${totalPad}`
    }

    this.setTrackTitle(this.cleanTrackName(file))
    const encoded = encodeURI(`/music/${file}`)

    if (this.audio) {
      this.audio.src = encoded
      this.audio.load()
    }

    this.extractCover(encoded)

    if (autoPlay) {
      this.play()
    } else {
      this.updateWavy(0)
    }
  }

  async extractCover(audioUrl) {
    if (this.coverUrl) {
      URL.revokeObjectURL(this.coverUrl)
      this.coverUrl = null
    }

    if (this.coverImg) {
      this.coverImg.hidden = true
      this.coverImg.src = ''
    }

    try {
      const { parseWebStream } = await import('music-metadata')
      const res = await fetch(audioUrl)
      if (!res.ok) return
      const mimeType = res.headers.get('Content-Type') || 'audio/unknown'
      const { common } = await parseWebStream(res.body, { mimeType })
      const pic = common.picture && common.picture[0]
      if (pic) {
        const blob = new Blob([pic.data], { type: pic.format })
        this.coverUrl = URL.createObjectURL(blob)
        if (this.coverImg) {
          this.coverImg.src = this.coverUrl
          this.coverImg.hidden = false
        }
      }
    } catch {}
  }

  play() {
    if (!this.audio) return
    const promise = this.audio.play()
    if (promise !== undefined) {
      promise
        .then(() => {
          this.isPlaying = true
          this.updateState()
          this.startWaveAnimation()
        })
        .catch(() => {
          this.isPlaying = false
          this.updateState()
        })
    }
  }

  pause() {
    if (!this.audio) return
    this.audio.pause()
    this.isPlaying = false
    this.updateState()
    this.stopWaveAnimation()
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  updateState() {
    const state = this.isPlaying ? 'playing' : 'paused'
    if (this.card) this.card.dataset.state = state
    if (this.playIcon) {
      this.playIcon.textContent = this.isPlaying ? 'pause' : 'play_arrow'
    }
    if (this.btnPlay && this.i18n) {
      const labelKey = this.isPlaying ? 'player.pause' : 'player.play'
      this.btnPlay.setAttribute('aria-label', this.i18n.t(labelKey))
    }
  }

  formatTime(sec) {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  updateWavy(percent) {
    if (!this.wavySvg || !this.wavyActive || !this.wavyTrack || !this.wavyStop) return

    const rect = this.wavySvg.getBoundingClientRect()
    const width = rect.width || 280
    const height = rect.height || 28
    const midY = height / 2

    const splitX = Math.max(0, Math.min(width, (percent / 100) * width))

    const step = 3
    const amplitude = this.isPlaying ? 2.2 : 0
    const wavelength = 40

    let activePath = `M 0 ${midY}`
    for (let x = 0; x <= splitX; x += step) {
      const y = midY + Math.sin((x / wavelength) * 2 * Math.PI - this.phase) * amplitude
      activePath += ` L ${x.toFixed(1)} ${y.toFixed(1)}`
    }
    activePath += ` L ${splitX.toFixed(1)} ${midY}`

    const trackPath = `M ${splitX.toFixed(1)} ${midY} L ${width.toFixed(1)} ${midY}`

    this.wavyActive.setAttribute('d', activePath)
    this.wavyTrack.setAttribute('d', trackPath)

    this.wavyStop.setAttribute('cx', splitX.toFixed(1))
    this.wavyStop.setAttribute('cy', midY.toString())

    if (this.wavy) {
      this.wavy.setAttribute('aria-valuenow', Math.round(percent).toString())
      if (this.audio && this.audio.currentTime) {
        this.wavy.setAttribute('aria-valuetext', this.formatTime(this.audio.currentTime))
      }
    }
  }

  startWaveAnimation() {
    if (this.animFrameId) return
    const loop = () => {
      this.phase += 0.02
      if (this.audio && this.audio.duration) {
        const pct = (this.audio.currentTime / this.audio.duration) * 100
        this.updateWavy(pct)
      } else {
        this.updateWavy(0)
      }
      this.animFrameId = requestAnimationFrame(loop)
    }
    this.animFrameId = requestAnimationFrame(loop)
  }

  stopWaveAnimation() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
    if (this.audio && this.audio.duration) {
      const pct = (this.audio.currentTime / this.audio.duration) * 100
      this.updateWavy(pct)
    }
  }

  seekToPercent(pct) {
    if (!this.audio || !this.audio.duration) return
    this.audio.currentTime = (pct / 100) * this.audio.duration
    this.updateWavy(pct)
  }

  bindEvents() {
    if (this.btnPlay) {
      this.btnPlay.addEventListener('click', () => this.togglePlay())
    }

    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => this.loadTrack(this.currentIndex + 1))
    }

    if (this.btnPrev) {
      this.btnPrev.addEventListener('click', () => this.loadTrack(this.currentIndex - 1))
    }

    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', e => {
        this.setVolume(parseFloat(e.target.value))
      })
    }

    if (this.btnMute) {
      this.btnMute.addEventListener('click', () => this.toggleMute())
    }

    if (this.audio) {
      this.audio.addEventListener('loadedmetadata', () => {
        if (this.timeTotal) {
          this.timeTotal.textContent = this.formatTime(this.audio.duration)
        }
      })

      this.audio.addEventListener('timeupdate', () => {
        if (this.timeCurrent) {
          this.timeCurrent.textContent = this.formatTime(this.audio.currentTime)
        }
        if (!this.animFrameId && this.audio.duration) {
          const pct = (this.audio.currentTime / this.audio.duration) * 100
          this.updateWavy(pct)
        }
      })

      this.audio.addEventListener('ended', () => {
        this.loadTrack(this.currentIndex + 1)
      })

      this.audio.addEventListener('error', () => {
        this.pause()
      })
    }

    const handleSeek = event => {
      if (!this.wavy) return
      const rect = this.wavy.getBoundingClientRect()
      const clientX = event.clientX ?? (event.touches && event.touches[0].clientX)
      if (clientX === undefined) return
      const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left))
      const pct = (offsetX / rect.width) * 100
      this.seekToPercent(pct)
    }

    if (this.wavy) {
      this.wavy.addEventListener('click', handleSeek)

      this.wavy.addEventListener('keydown', e => {
        if (!this.audio || !this.audio.duration) return
        if (e.key === 'ArrowRight') {
          this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 5)
        } else if (e.key === 'ArrowLeft') {
          this.audio.currentTime = Math.max(0, this.audio.currentTime - 5)
        } else if (e.key === ' ') {
          e.preventDefault()
          this.togglePlay()
        }
      })
    }

    window.addEventListener('resize', () => {
      if (this.audio && this.audio.duration) {
        const pct = (this.audio.currentTime / this.audio.duration) * 100
        this.updateWavy(pct)
      } else {
        this.updateWavy(0)
      }
    })
  }
}
