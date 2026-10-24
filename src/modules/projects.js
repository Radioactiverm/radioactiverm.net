import { projects } from '../data/projects.js'

export class ProjectsManager {
  constructor(i18n) {
    this.i18n = i18n
    this.grid = document.getElementById('projects-grid')
    this.render()
  }

  render() {
    if (!this.grid) return

    const isCs = this.i18n && this.i18n.currentLang === 'cs'

    this.grid.innerHTML = projects
      .map((proj, idx) => {
        const desc = isCs && proj.descCs ? proj.descCs : proj.desc
        const toneClass = proj.tone || ''
        const visitLabel = this.i18n ? this.i18n.t('projects.visit') : 'Open live app'
        const codeLabel = this.i18n ? this.i18n.t('projects.code') : 'Source code'

        const transitSvg = proj.isTransit
          ? `
          <svg class="transit-map" viewBox="0 0 340 220" aria-hidden="true">
            <path class="route" d="M 20 180 C 80 170, 100 120, 160 110 S 240 60, 310 40" />
            <path class="route route-alt" d="M 40 40 C 90 90, 180 80, 220 150 S 290 190, 320 180" />
            <circle class="stop" cx="20" cy="180" r="5" />
            <circle class="stop" cx="160" cy="110" r="6" />
            <circle class="stop" cx="310" cy="40" r="5" />
            <circle class="stop" cx="40" cy="40" r="5" />
            <circle class="stop" cx="220" cy="150" r="6" />
            <rect class="bus" x="150" y="100" width="20" height="12" rx="3" />
            <rect class="bus bus-alt" x="212" y="142" width="18" height="11" rx="3" />
          </svg>
        `
          : ''

        const tagsHtml = proj.tags.map(t => `<span class="tag mono">${t}</span>`).join('')

        return `
        <article class="card project-card ${toneClass} reveal" style="--span:${proj.span}; --span-md:${proj.spanMd}; --i:${idx}">
          ${transitSvg}
          <div class="project-content">
            <div class="project-top">
              <div class="project-icon">
                <span class="ms" aria-hidden="true">${proj.icon}</span>
              </div>
              <span class="live-badge" data-state="${proj.badgeState}">
                <span class="dot ${proj.badgeState === 'online' ? 'dot-live' : ''}" aria-hidden="true"></span>
                <span>${proj.badge}</span>
              </span>
            </div>
            <div>
              <h3 class="project-title">${proj.title}</h3>
              <p class="project-desc">${desc}</p>
            </div>
            <div class="project-tags">
              ${tagsHtml}
            </div>
            <div class="project-foot">
              <div class="profile-actions">
                <a class="btn btn-filled sl ripple" href="${proj.liveUrl}" target="_blank" rel="noopener noreferrer">
                  <span>${visitLabel}</span>
                  <span class="ms" aria-hidden="true">arrow_outward</span>
                </a>
                <a class="btn btn-outlined sl ripple" href="${proj.repoUrl}" target="_blank" rel="noopener noreferrer">
                  <span class="ms" aria-hidden="true">code</span>
                  <span>${codeLabel}</span>
                </a>
              </div>
            </div>
          </div>
        </article>
      `
      })
      .join('')
  }
}
