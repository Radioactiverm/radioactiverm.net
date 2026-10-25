import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/layout.css'
import './styles/cards.css'

import { I18nManager } from './modules/i18n.js'
import { ThemeManager } from './modules/theme.js'
import { TelemetryManager } from './modules/telemetry.js'
import { GitHubManager } from './modules/github.js'
import { LanyardManager } from './modules/lanyard.js'
import { MusicPlayer } from './modules/player.js'
import { StackManager } from './modules/stack.js'
import { TerminalManager } from './modules/terminal.js'
import { ProjectsManager } from './modules/projects.js'
import { InteractionsManager } from './modules/interactions.js'
import { TypewriterManager } from './modules/typewriter.js'

const INTERESTS = [
  { icon: 'terminal', label: 'CachyOS' },
  { icon: 'dns', label: 'Proxmox VE' },
  { icon: 'home_iot_device', label: 'Home Assistant' },
  { icon: 'developer_board', label: 'ESP32' },
  { icon: 'lightbulb', label: 'WLED' },
  { icon: 'hub', label: 'Networking' },
  { icon: 'security', label: 'Pentesting' }
]

function renderInterests() {
  const container = document.getElementById('interest-chips')
  if (!container) return
  container.innerHTML = INTERESTS.map(
    item => `
    <li class="chip sl ripple">
      <span class="ms" aria-hidden="true">${item.icon}</span>
      <span>${item.label}</span>
    </li>
  `
  ).join('')
}

function initApp() {
  let i18n
  try { i18n = new I18nManager() } catch {}
  try { new ThemeManager() } catch {}
  let projects
  try { projects = new ProjectsManager(i18n) } catch {}
  let stack
  try { stack = new StackManager(i18n) } catch {}
  try { new TerminalManager() } catch {}
  let telemetry
  try { telemetry = new TelemetryManager(i18n) } catch {}
  try { new GitHubManager(i18n) } catch {}
  try { new LanyardManager(i18n) } catch {}
  try { new MusicPlayer(i18n) } catch {}
  let interactions
  try { interactions = new InteractionsManager(i18n) } catch {}
  let typewriter
  try { typewriter = new TypewriterManager(i18n) } catch {}

  try { renderInterests() } catch {}

  if (i18n) {
    i18n.onChange(() => {
      try { typewriter?.handleLangChange() } catch {}
      try { projects?.render() } catch {}
      try { stack?.renderFilters() } catch {}
      try { telemetry?.updateClock() } catch {}
      try { interactions?.initCardSpotlights() } catch {}
      try { interactions?.initScrollReveals() } catch {}
    })
  }

  const yearEl = document.getElementById('footer-year')
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString()
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp)
} else {
  initApp()
}
