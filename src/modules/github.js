const CACHE_KEY = 'rm:github:cache'
const CACHE_TTL = 10 * 60 * 1000

const FALLBACK_DATA = {
  repos: 4,
  stars: 4,
  followers: 0,
  since: '2020',
  heat: [0, 0, 1, 0, 0, 2, 0, 0, 3, 1, 0, 0, 4, 2, 0, 1, 0, 0, 5, 2, 0, 0, 3, 1, 0, 2, 4, 6, 2, 5],
  feed: [
    {
      type: 'PushEvent',
      repo: 'Radioactiverm/radioactiverm.net',
      time: 'Recently',
      title: 'Material 3 Expressive redesign'
    },
    {
      type: 'PushEvent',
      repo: 'Radioactiverm/dpmj-api',
      time: '1 week ago',
      title: 'Update transit telemetry parser'
    },
    {
      type: 'CreateEvent',
      repo: 'Radioactiverm/flipper-fsociety-asset-pack',
      time: 'Last year',
      title: 'Release asset pack for Flipper Zero'
    }
  ]
}

export class GitHubManager {
  constructor(i18n) {
    this.i18n = i18n
    this.card = document.getElementById('card-github')
    this.stateBtn = document.getElementById('gh-state')
    this.stateText = document.getElementById('gh-state-text')
    this.reposEl = document.getElementById('gh-repos')
    this.starsEl = document.getElementById('gh-stars')
    this.followersEl = document.getElementById('gh-followers')
    this.sinceEl = document.getElementById('gh-since')
    this.heatContainer = document.getElementById('gh-heat')
    this.feedContainer = document.getElementById('gh-feed')

    if (this.stateBtn) {
      this.stateBtn.addEventListener('click', () => this.fetchData(true))
    }

    this.fetchData(false)
  }

  getCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed
    } catch {
      return null
    }
  }

  setCache(data) {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          data
        })
      )
    } catch {}
  }

  async fetchData(forceRefresh = false) {
    this.setCardState('loading', 'sync')

    const cached = this.getCache()
    const now = Date.now()
    if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL) {
      this.render(cached.data)
      this.setCardState('cached', 'gh.cached')
      return
    }

    try {
      const [userRes, reposRes, eventsRes] = await Promise.all([
        fetch('https://api.github.com/users/Radioactiverm'),
        fetch('https://api.github.com/users/Radioactiverm/repos?per_page=100&sort=updated'),
        fetch('https://api.github.com/users/Radioactiverm/events/public?per_page=30')
      ])

      if (userRes.status === 403 || reposRes.status === 403) {
        if (cached && cached.data) {
          this.render(cached.data)
          this.setCardState('limited', 'gh.limited')
          return
        }
        this.render(FALLBACK_DATA)
        this.setCardState('limited', 'gh.limited')
        return
      }

      if (!userRes.ok || !reposRes.ok) {
        throw new Error('GitHub API response not ok')
      }

      const userData = await userRes.json()
      const reposData = await reposRes.json()
      const eventsData = eventsRes.ok ? await eventsRes.json() : []

      const totalStars = Array.isArray(reposData)
        ? reposData.reduce((acc, r) => acc + (r.stargazers_count || 0), 0)
        : FALLBACK_DATA.stars

      const sinceYear = userData.created_at ? new Date(userData.created_at).getFullYear().toString() : '2020'

      const heat = this.processEventsHeatmap(eventsData)
      const feed = this.processEventsFeed(eventsData)

      const payload = {
        repos: userData.public_repos ?? FALLBACK_DATA.repos,
        stars: totalStars,
        followers: userData.followers ?? FALLBACK_DATA.followers,
        since: sinceYear,
        heat,
        feed
      }

      this.setCache(payload)
      this.render(payload)
      this.setCardState('live', 'gh.sync')
    } catch {
      if (cached && cached.data) {
        this.render(cached.data)
        this.setCardState('cached', 'gh.cached')
      } else {
        this.render(FALLBACK_DATA)
        this.setCardState('offline', 'gh.offline')
      }
    }
  }

  processEventsHeatmap(events) {
    const counts = new Array(30).fill(0)
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000

    if (Array.isArray(events)) {
      events.forEach(ev => {
        if (!ev.created_at) return
        const evTime = new Date(ev.created_at).getTime()
        const dayDiff = Math.floor((now - evTime) / oneDay)
        if (dayDiff >= 0 && dayDiff < 30) {
          counts[29 - dayDiff]++
        }
      })
    }

    const hasAny = counts.some(c => c > 0)
    return hasAny ? counts : FALLBACK_DATA.heat
  }

  processEventsFeed(events) {
    if (!Array.isArray(events) || events.length === 0) {
      return FALLBACK_DATA.feed
    }

    const items = []
    for (const ev of events) {
      if (items.length >= 3) break
      let title = ''
      if (ev.type === 'PushEvent' && ev.payload && ev.payload.commits && ev.payload.commits.length > 0) {
        title = ev.payload.commits[0].message.split('\n')[0]
      } else if (ev.type === 'CreateEvent') {
        title = `Created ${ev.payload.ref_type || 'repository'} ${ev.payload.ref || ''}`
      } else if (ev.type === 'WatchEvent') {
        title = 'Starred repository'
      } else {
        title = ev.type.replace('Event', '')
      }

      items.push({
        type: ev.type,
        repo: ev.repo ? ev.repo.name : 'Radioactiverm',
        time: this.formatRelativeTime(ev.created_at),
        title
      })
    }

    return items.length > 0 ? items : FALLBACK_DATA.feed
  }

  formatRelativeTime(iso) {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const sec = Math.floor(diff / 1000)
    const min = Math.floor(sec / 60)
    const hr = Math.floor(min / 60)
    const day = Math.floor(hr / 24)

    if (day > 0) return `${day}d ago`
    if (hr > 0) return `${hr}h ago`
    if (min > 0) return `${min}m ago`
    return 'just now'
  }

  render(data) {
    if (this.reposEl) {
      this.reposEl.textContent = data.repos.toString()
      this.reposEl.classList.remove('skeleton')
    }
    if (this.starsEl) {
      this.starsEl.textContent = data.stars.toString()
      this.starsEl.classList.remove('skeleton')
    }
    if (this.followersEl) {
      this.followersEl.textContent = data.followers.toString()
      this.followersEl.classList.remove('skeleton')
    }
    if (this.sinceEl) {
      this.sinceEl.textContent = data.since.toString()
      this.sinceEl.classList.remove('skeleton')
    }

    if (this.heatContainer && Array.isArray(data.heat)) {
      const maxCount = Math.max(1, ...data.heat)
      this.heatContainer.innerHTML = data.heat
        .map((count, idx) => {
          const ratio = (count / maxCount).toFixed(2)
          return `<span style="--h:${ratio}; --bi:${idx}" ${count === 0 ? 'data-empty="true"' : ''} title="${count} events"></span>`
        })
        .join('')
    }

    if (this.feedContainer && Array.isArray(data.feed)) {
      this.feedContainer.innerHTML = data.feed
        .map(item => {
          let icon = 'commit'
          if (item.type === 'CreateEvent') icon = 'add_circle'
          else if (item.type === 'WatchEvent') icon = 'star'

          const repoShort = item.repo.replace('Radioactiverm/', '')
          return `
          <li>
            <span class="gh-feed-icon"><span class="ms" aria-hidden="true">${icon}</span></span>
            <span class="gh-feed-text">
              <b><a href="https://github.com/${item.repo}" target="_blank" rel="noopener noreferrer">${repoShort}</a></b>
              <span>${item.title}</span>
            </span>
            <span class="gh-feed-time mono">${item.time}</span>
          </li>
        `
        })
        .join('')
    }
  }

  setCardState(state, textKey) {
    if (this.card) this.card.dataset.state = state
    if (this.stateText && this.i18n) {
      this.stateText.textContent = this.i18n.t(textKey) || state
    }
  }
}
