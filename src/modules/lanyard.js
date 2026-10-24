const DISCORD_ID = '634485482658725890'
const BADGE_DIR = '/icons/badges/'

const LIVE_FLAGS = [
  { bit: 1 << 0, label: 'Staff', file: 'staff.png' },
  { bit: 1 << 1, label: 'Partnered Server Owner', file: 'partner.png' },
  { bit: 1 << 2, label: 'HypeSquad Events', file: 'hypesquad_events.png' },
  { bit: 1 << 3, label: 'Bug Hunter', file: 'bughunter1.png' },
  { bit: 1 << 6, label: 'HypeSquad Bravery', file: 'bravery.png' },
  { bit: 1 << 7, label: 'HypeSquad Brilliance', file: 'brilliance.png' },
  { bit: 1 << 8, label: 'HypeSquad Balance', file: 'balance.png' },
  { bit: 1 << 9, label: 'Early Supporter', file: 'early_supporter.png' },
  { bit: 1 << 14, label: 'Bug Hunter (Gold)', file: 'bughunter2.png' },
  { bit: 1 << 17, label: 'Early Verified Bot Developer', file: 'botdev.png' },
  { bit: 1 << 18, label: 'Moderator Programs Alumni', file: 'moderator.png' },
  { bit: 1 << 22, label: 'Active Developer', file: 'active-developer.svg' }
]

const STATIC_BADGES = [
  { label: 'Discord Nitro', file: 'nitro.png' },
  { label: 'Orbs Apprentice', file: 'orb.svg' },
  { label: 'Completed a Quest', file: 'quest.png' },
  { label: 'Originally known as Radioactiverm#2265', file: 'username.png' },
  { label: 'Server boosting since Aug 13, 2026', file: 'boosting_1.png' },
  { label: 'Active Developer', file: 'active-developer.svg' }
]

export class LanyardManager {
  constructor(i18n) {
    this.i18n = i18n
    this.avatar = document.getElementById('avatar')
    this.avatarStage = document.getElementById('avatar-stage')
    this.avatarHaloPath = document.getElementById('avatar-halo-path')
    this.presence = document.getElementById('presence')
    this.presenceStatus = document.getElementById('presence-status')
    this.presenceActivity = document.getElementById('presence-activity')
    this.badgeRow = document.getElementById('badge-row')

    this.initHalo()
    this.initWebSocket()
  }

  initHalo() {
    if (!this.avatarHaloPath) return
    const pts = []
    const count = 120
    for (let i = 0; i <= count; i++) {
      const theta = (i / count) * 2 * Math.PI
      const r = 90 + 6 * Math.cos(12 * theta)
      const x = (100 + r * Math.cos(theta)).toFixed(1)
      const y = (100 + r * Math.sin(theta)).toFixed(1)
      pts.push(`${x} ${y}`)
    }
    this.avatarHaloPath.setAttribute('d', 'M ' + pts.join(' L ') + ' Z')
  }

  initWebSocket() {
    let ws
    let heartbeatTimer

    const connect = () => {
      try {
        ws = new WebSocket('wss://api.lanyard.rest/socket')

        ws.onopen = () => {}

        ws.onmessage = event => {
          try {
            const msg = JSON.parse(event.data)
            const { op, d, t } = msg

            if (op === 1) {
              heartbeatTimer = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ op: 3 }))
                }
              }, d.heartbeat_interval)

              ws.send(
                JSON.stringify({
                  op: 2,
                  d: { subscribe_to_id: DISCORD_ID }
                })
              )
            } else if (t === 'INIT_STATE' || t === 'PRESENCE_UPDATE') {
              this.handleData(d)
            }
          } catch {}
        }

        ws.onclose = () => {
          clearInterval(heartbeatTimer)
          setTimeout(connect, 6000)
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch {
        this.fallbackPolling()
      }
    }

    connect()
    this.fallbackFetch()
  }

  async fallbackFetch() {
    try {
      const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`)
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          this.handleData(json.data)
        }
      }
    } catch {}
  }

  fallbackPolling() {
    setInterval(() => this.fallbackFetch(), 15000)
  }

  handleData(data) {
    if (!data) return

    const user = data.discord_user || {}
    const status = data.discord_status || 'offline'

    if (this.avatar && user.avatar) {
      const ext = user.avatar.startsWith('a_') ? 'gif' : 'png'
      this.avatar.src = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${user.avatar}.${ext}?size=256`
    }

    if (this.avatarStage) {
      this.avatarStage.dataset.status = status
    }
    if (this.presence) {
      this.presence.dataset.status = status
    }

    if (this.presenceStatus && this.i18n) {
      const key = `presence.${status}`
      this.presenceStatus.textContent = this.i18n.t(key) || status
    }

    this.renderActivity(data)
    this.renderBadges(user)
  }

  renderActivity(data) {
    if (!this.presenceActivity) return

    if (data.listening_to_spotify && data.spotify) {
      this.presenceActivity.textContent = `🎵 ${data.spotify.song} — ${data.spotify.artist}`
      return
    }

    const activities = data.activities || []
    const custom = activities.find(a => a.type === 4)
    const other = activities.find(a => a.type !== 4)

    if (custom && (custom.state || (custom.emoji && custom.emoji.name))) {
      const emoji = custom.emoji ? (custom.emoji.name || '') + ' ' : ''
      this.presenceActivity.textContent = `${emoji}${custom.state || ''}`.trim()
      return
    }

    if (other) {
      const verbs = { 0: 'Playing', 1: 'Streaming', 2: 'Listening to', 3: 'Watching', 5: 'Competing in' }
      const verb = verbs[other.type] || 'Playing'
      this.presenceActivity.textContent = `${verb} ${other.name}`
      return
    }

    this.presenceActivity.textContent = ''
  }

  renderBadges(user) {
    if (!this.badgeRow) return
    this.badgeRow.innerHTML = ''

    const flags = user.public_flags || 0
    const addedFiles = new Set()

    LIVE_FLAGS.forEach(({ bit, label, file }) => {
      if (flags & bit && !addedFiles.has(file)) {
        addedFiles.add(file)
        this.appendBadge(file, label)
      }
    })

    STATIC_BADGES.forEach(({ label, file }) => {
      if (!addedFiles.has(file)) {
        addedFiles.add(file)
        this.appendBadge(file, label)
      }
    })
  }

  appendBadge(file, label) {
    const li = document.createElement('li')
    li.title = label
    li.setAttribute('aria-label', label)

    const img = document.createElement('img')
    img.src = BADGE_DIR + file
    img.alt = label
    img.loading = 'lazy'
    img.onerror = () => li.remove()

    li.appendChild(img)
    this.badgeRow.appendChild(li)
  }
}
