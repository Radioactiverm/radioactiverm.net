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
    this.coverCache = new Map()
    this.coverUrl = null
    this.savedVolume = 0.8
    this.currentBpm = 120
    this.isDragging = false
    this.dragPercent = null

    this.init()
  }

  async init() {
    this.initVolume()
    this.bindEvents()
    const svg = document.getElementById('m3-album-svg')
    if (svg && typeof svg.pauseAnimations === 'function') {
      svg.pauseAnimations()
    }
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
      } else {
        throw new Error('empty')
      }
    } catch {
      this.playlist = [
        'фруктовый 1.0.m4a',
        'Cachalot (Slowed).opus',
        'ex-freundin (slowed + instrumental).opus',
        'superswag pt. 1.opus',
        'vlone (slowed).opus'
      ]
    }
    this.preloadCovers()
    this.loadTrack(0, false)
  }

  getTrackFile(item) {
    if (!item) return ''
    return typeof item === 'string' ? item : item.file || ''
  }

  getTrackBpm(item) {
    if (typeof item === 'object' && item && item.bpm) {
      return Number(item.bpm)
    }
    return null
  }

  getCoverUrl(filename) {
    const base = filename.replace(/\.[^/.]+$/, '')
    return encodeURI(`/music/covers/${base}.jpg`)
  }

  preloadCovers() {
    for (const item of this.playlist) {
      const file = this.getTrackFile(item)
      if (!file) continue
      const url = this.getCoverUrl(file)
      const img = new Image()
      img.src = url
      this.coverCache.set(file, url)
    }
  }

  applyBpm(bpm) {
    const safeBpm = Math.max(50, Math.min(220, Number(bpm) || 120))
    this.currentBpm = safeBpm
    const beatSec = 60 / safeBpm
    const morphDur = (beatSec * 16).toFixed(2) + 's'
    const spinDur = (beatSec * 32).toFixed(2) + 's'

    const anim = document.getElementById('m3-morph-anim')
    if (anim) {
      anim.setAttribute('dur', morphDur)
      if (this.isPlaying && typeof anim.beginElement === 'function') {
        try {
          anim.beginElement()
        } catch {}
      }
    }

    if (this.cover) {
      this.cover.style.setProperty('--cover-spin-dur', spinDur)
    }
  }

  async detectBpm(url) {
    try {
      const res = await fetch(url)
      const arrayBuffer = await res.arrayBuffer()
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return 120
      const audioCtx = new AudioCtx()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      const channelData = audioBuffer.getChannelData(0)
      const sampleRate = audioBuffer.sampleRate

      const step = Math.floor(sampleRate / 100)
      const len = Math.min(channelData.length, sampleRate * 45)
      const energy = []
      for (let i = 0; i < len; i += step) {
        let sum = 0
        for (let j = 0; j < step && i + j < len; j++) {
          sum += channelData[i + j] * channelData[i + j]
        }
        energy.push(sum / step)
      }

      const diffs = [0]
      for (let i = 1; i < energy.length; i++) {
        const d = energy[i] - energy[i - 1]
        diffs.push(d > 0 ? d : 0)
      }

      const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length
      const flux = diffs.map(d => Math.max(0, d - mean))

      const frameRate = sampleRate / step
      const minBpm = 60
      const maxBpm = 180
      const minLag = Math.floor((frameRate * 60) / maxBpm)
      const maxLag = Math.floor((frameRate * 60) / minBpm)

      let bestCorr = 0
      let bestLag = minLag
      for (let lag = minLag; lag <= maxLag; lag++) {
        let corr = 0
        for (let i = lag; i < flux.length; i++) {
          corr += flux[i] * flux[i - lag]
        }
        if (corr > bestCorr) {
          bestCorr = corr
          bestLag = lag
        }
      }

      const bpm = Math.round((frameRate * 60) / bestLag)
      audioCtx.close().catch(() => {})
      return bpm >= 60 && bpm <= 200 ? bpm : 120
    } catch {
      return 120
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
    const item = this.playlist[this.currentIndex]
    const file = this.getTrackFile(item)

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

    const coverUrl = this.coverCache.get(file) || this.getCoverUrl(file)
    if (this.coverImg) {
      this.coverImg.src = coverUrl
      this.coverImg.hidden = false
      this.coverImg.onerror = () => {
        this.extractCover(encoded)
      }
    }

    const explicitBpm = this.getTrackBpm(item)
    if (explicitBpm) {
      this.applyBpm(explicitBpm)
    } else {
      this.detectBpm(encoded).then(bpm => {
        if (this.playlist[this.currentIndex] === item) {
          this.applyBpm(bpm)
        }
      })
    }

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
          const svg = document.getElementById('m3-album-svg')
          if (svg && typeof svg.unpauseAnimations === 'function') {
            svg.unpauseAnimations()
          }
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
    const svg = document.getElementById('m3-album-svg')
    if (svg && typeof svg.pauseAnimations === 'function') {
      svg.pauseAnimations()
    }
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

    const step = 2
    const amplitude = this.isPlaying ? 2.4 : 0
    const wavelength = 36
    const flatStart = 10
    const flatEnd = 12

    let activePath = `M 0 ${midY.toFixed(1)}`

    if (splitX <= flatStart + flatEnd) {
      activePath += ` L ${splitX.toFixed(1)} ${midY.toFixed(1)}`
    } else {
      const avail = splitX - flatStart - flatEnd
      const fade = Math.min(24, avail / 2)

      activePath += ` L ${flatStart.toFixed(1)} ${midY.toFixed(1)}`

      for (let x = flatStart; x <= splitX - flatEnd; x += step) {
        let envelope = 1
        if (x < flatStart + fade) {
          const t = (x - flatStart) / fade
          envelope = 0.5 * (1 - Math.cos(t * Math.PI))
        } else if (x > splitX - flatEnd - fade) {
          const t = (splitX - flatEnd - x) / fade
          envelope = 0.5 * (1 - Math.cos(t * Math.PI))
        }
        const amp = amplitude * envelope
        const y = midY + Math.sin(((x - flatStart) / wavelength) * 2 * Math.PI - this.phase) * amp
        activePath += ` L ${x.toFixed(1)} ${y.toFixed(1)}`
      }

      activePath += ` L ${(splitX - flatEnd).toFixed(1)} ${midY.toFixed(1)}`
      activePath += ` L ${splitX.toFixed(1)} ${midY.toFixed(1)}`
    }

    const trackPath = `M ${splitX.toFixed(1)} ${midY.toFixed(1)} L ${width.toFixed(1)} ${midY.toFixed(1)}`

    this.wavyActive.setAttribute('d', activePath)
    this.wavyTrack.setAttribute('d', trackPath)

    this.wavyStop.setAttribute('cx', splitX.toFixed(1))
    this.wavyStop.setAttribute('cy', midY.toFixed(1))

    if (this.wavy) {
      this.wavy.setAttribute('aria-valuenow', Math.round(percent).toString())
      if (this.audio && this.audio.duration) {
        const curSec = (percent / 100) * this.audio.duration
        this.wavy.setAttribute('aria-valuetext', this.formatTime(curSec))
      }
    }
  }

  startWaveAnimation() {
    if (this.animFrameId) return
    const loop = () => {
      this.phase += 0.02
      if (this.isDragging && this.dragPercent !== null) {
        this.updateWavy(this.dragPercent)
      } else if (this.audio && this.audio.duration) {
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
    if (this.isDragging && this.dragPercent !== null) {
      this.updateWavy(this.dragPercent)
    } else if (this.audio && this.audio.duration) {
      const pct = (this.audio.currentTime / this.audio.duration) * 100
      this.updateWavy(pct)
    }
  }

  seekToPercent(pct, isFinal = false) {
    const clampedPct = Math.max(0, Math.min(100, pct))
    this.dragPercent = clampedPct
    if (this.audio && this.audio.duration) {
      const targetTime = (clampedPct / 100) * this.audio.duration
      this.audio.currentTime = targetTime
      if (this.timeCurrent) {
        this.timeCurrent.textContent = this.formatTime(targetTime)
      }
    }
    this.updateWavy(clampedPct)
    if (isFinal) {
      this.dragPercent = null
    }
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
        if (this.isDragging) return
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

    const getPercentFromEvent = event => {
      if (!this.wavy) return 0
      const rect = this.wavy.getBoundingClientRect()
      const clientX = event.clientX !== undefined
        ? event.clientX
        : (event.touches && event.touches[0] ? event.touches[0].clientX : 0)
      const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left))
      return rect.width ? (offsetX / rect.width) * 100 : 0
    }

    if (this.wavy) {
      const onPointerDown = e => {
        if (e.button !== undefined && e.button !== 0) return
        this.isDragging = true
        this.wavy.classList.add('is-dragging')
        try {
          this.wavy.setPointerCapture(e.pointerId)
        } catch {}
        const pct = getPercentFromEvent(e)
        this.seekToPercent(pct, false)
        e.preventDefault()
      }

      const onPointerMove = e => {
        if (!this.isDragging) return
        const pct = getPercentFromEvent(e)
        this.seekToPercent(pct, false)
        e.preventDefault()
      }

      const onPointerUp = e => {
        if (!this.isDragging) return
        this.isDragging = false
        this.wavy.classList.remove('is-dragging')
        try {
          if (this.wavy.hasPointerCapture(e.pointerId)) {
            this.wavy.releasePointerCapture(e.pointerId)
          }
        } catch {}
        const pct = getPercentFromEvent(e)
        this.seekToPercent(pct, true)
      }

      this.wavy.addEventListener('pointerdown', onPointerDown)
      this.wavy.addEventListener('pointermove', onPointerMove)
      this.wavy.addEventListener('pointerup', onPointerUp)
      this.wavy.addEventListener('pointercancel', onPointerUp)
      this.wavy.addEventListener('click', e => e.preventDefault())

      this.wavy.addEventListener('keydown', e => {
        if (!this.audio || !this.audio.duration) return
        if (e.key === 'ArrowRight') {
          this.seekToPercent(Math.min(100, ((this.audio.currentTime + 5) / this.audio.duration) * 100), true)
        } else if (e.key === 'ArrowLeft') {
          this.seekToPercent(Math.max(0, ((this.audio.currentTime - 5) / this.audio.duration) * 100), true)
        } else if (e.key === ' ') {
          e.preventDefault()
          this.togglePlay()
        }
      })
    }

    window.addEventListener('resize', () => {
      if (this.isDragging && this.dragPercent !== null) {
        this.updateWavy(this.dragPercent)
      } else if (this.audio && this.audio.duration) {
        const pct = (this.audio.currentTime / this.audio.duration) * 100
        this.updateWavy(pct)
      } else {
        this.updateWavy(0)
      }
    })
  }
}
