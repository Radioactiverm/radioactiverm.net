export class TelemetryManager {
  constructor(i18n) {
    this.i18n = i18n
    this.clockChipTime = document.getElementById('clock-chip-time')
    this.clockChipZone = document.getElementById('clock-chip-zone')
    this.clockHm = document.getElementById('clock-hm')
    this.clockSec = document.getElementById('clock-sec')
    this.clockDate = document.getElementById('clock-date')
    this.timeZoneTag = document.getElementById('time-zone-tag')
    this.dayProgress = document.getElementById('day-progress')
    this.dayProgressFill = document.getElementById('day-progress-fill')
    this.dayProgressLabel = document.getElementById('day-progress-label')
    this.partOfDayIcon = document.getElementById('part-of-day-icon')
    this.partOfDayText = document.getElementById('part-of-day-text')
    this.timeDiff = document.getElementById('time-diff')

    this.pragueFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Prague',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
    this.offsetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Prague',
      timeZoneName: 'longOffset'
    })
    this.dateFormatters = {}

    this.startClock()
  }

  startClock() {
    this.updateClock()
    setInterval(() => this.updateClock(), 1000)
  }

  updateClock() {
    const now = new Date()

    const parts = this.pragueFormatter.formatToParts(now).reduce((acc, part) => {
      acc[part.type] = part.value
      return acc
    }, {})

    const hh = parts.hour || '00'
    const mm = parts.minute || '00'
    const ss = parts.second || '00'
    const tzName = parts.timeZoneName || 'CET'

    if (this.clockChipTime) this.clockChipTime.textContent = `${hh}:${mm}:${ss}`
    if (this.clockChipZone) this.clockChipZone.textContent = tzName
    if (this.clockHm) this.clockHm.textContent = `${hh}:${mm}:`
    if (this.clockSec) this.clockSec.textContent = ss

    const currentLang = this.i18n ? this.i18n.currentLang : 'en'
    const dateLocale = currentLang === 'cs' ? 'cs-CZ' : 'en-US'
    if (!this.dateFormatters[dateLocale]) {
      this.dateFormatters[dateLocale] = new Intl.DateTimeFormat(dateLocale, {
        timeZone: 'Europe/Prague',
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })
    }
    const dateFormatter = this.dateFormatters[dateLocale]
    if (this.clockDate) this.clockDate.textContent = dateFormatter.format(now)

    const hourNum = parseInt(hh, 10)
    const minNum = parseInt(mm, 10)
    const dayMinutes = hourNum * 60 + minNum
    const dayPercent = Math.min(100, Math.max(0, Math.round((dayMinutes / 1440) * 100)))

    if (this.dayProgress) {
      this.dayProgress.setAttribute('aria-valuenow', dayPercent.toString())
    }
    if (this.dayProgressFill) {
      this.dayProgressFill.style.setProperty('--progress', `${dayPercent}%`)
    }
    if (this.dayProgressLabel) {
      this.dayProgressLabel.textContent = `${dayPercent}%`
    }

    let partIcon = 'wb_sunny'
    let partKey = 'time.afternoon'
    if (hourNum >= 5 && hourNum < 12) {
      partIcon = 'wb_twilight'
      partKey = 'time.morning'
    } else if (hourNum >= 12 && hourNum < 18) {
      partIcon = 'wb_sunny'
      partKey = 'time.afternoon'
    } else if (hourNum >= 18 && hourNum < 22) {
      partIcon = 'dark_mode'
      partKey = 'time.evening'
    } else {
      partIcon = 'bedtime'
      partKey = 'time.night'
    }

    if (this.partOfDayIcon) this.partOfDayIcon.textContent = partIcon
    if (this.partOfDayText && this.i18n) {
      this.partOfDayText.textContent = this.i18n.t(partKey)
    }

    const pragueOffsetString = this.offsetFormatter.format(now).split(' ').pop()

    if (this.timeZoneTag) {
      this.timeZoneTag.textContent = `${tzName} · ${pragueOffsetString}`
    }

    const visitorOffsetMin = -now.getTimezoneOffset()
    const offsetMatch = pragueOffsetString.match(/([+-])(\d{2}):(\d{2})/)
    const pragueOffsetMin = offsetMatch ? (offsetMatch[1] === '-' ? -1 : 1) * (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3])) : 0
    const diffHours = Math.round((pragueOffsetMin - visitorOffsetMin) / 60)

    if (this.timeDiff && this.i18n) {
      if (diffHours === 0) {
        this.timeDiff.textContent = this.i18n.t('time.same')
      } else if (diffHours > 0) {
        this.timeDiff.textContent = `${Math.abs(diffHours)}h ${this.i18n.t('time.ahead')}`
      } else {
        this.timeDiff.textContent = `${Math.abs(diffHours)}h ${this.i18n.t('time.behind')}`
      }
    }
  }
}
