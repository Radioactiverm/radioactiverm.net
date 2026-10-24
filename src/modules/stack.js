import { categories, stackItems } from '../data/stack.js'

export class StackManager {
  constructor(i18n) {
    this.i18n = i18n
    this.filterContainer = document.getElementById('stack-filters')
    this.gridContainer = document.getElementById('stack-grid')
    this.countEl = document.getElementById('stack-count')

    this.activeCategory = 'all'
    this.renderFilters()
    this.renderItems()
    this.bindEvents()
  }

  renderFilters() {
    if (!this.filterContainer) return

    this.filterContainer.innerHTML = categories
      .map(cat => {
        const isAll = cat.id === 'all'
        const count = isAll ? stackItems.length : stackItems.filter(i => i.cat === cat.id).length
        const label = this.i18n ? this.i18n.t(cat.key) : cat.id
        const isActive = this.activeCategory === cat.id

        return `
        <button type="button" class="chip chip-filter sl ripple" data-filter="${cat.id}" aria-pressed="${isActive ? 'true' : 'false'}">
          <span class="ms chip-check" aria-hidden="true">check</span>
          <span>${label}</span>
          <span class="chip-count mono">${count}</span>
        </button>
      `
      })
      .join('')
  }

  renderItems() {
    if (!this.gridContainer) return

    const filtered =
      this.activeCategory === 'all' ? stackItems : stackItems.filter(item => item.cat === this.activeCategory)

    if (this.countEl) {
      this.countEl.textContent = filtered.length.toString()
    }

    this.gridContainer.innerHTML = filtered
      .map(item => {
        return `
        <li class="stack-item" data-cat="${item.cat}" style="--vt: stack-${item.id}">
          <div class="stack-icon">
            <span class="ms" aria-hidden="true">${item.icon}</span>
          </div>
          <div class="stack-text">
            <span class="stack-name">${item.name}</span>
            <span class="stack-desc">${item.desc}</span>
          </div>
        </li>
      `
      })
      .join('')
  }

  setCategory(catId) {
    if (this.activeCategory === catId) return
    this.activeCategory = catId

    const update = () => {
      this.renderFilters()
      this.renderItems()
    }

    if (document.startViewTransition && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      document.documentElement.classList.add('vt-stack')
      const transition = document.startViewTransition(update)
      transition.finished.finally(() => {
        document.documentElement.classList.remove('vt-stack')
      })
    } else {
      update()
    }
  }

  bindEvents() {
    if (this.filterContainer) {
      this.filterContainer.addEventListener('click', e => {
        const btn = e.target.closest('.chip-filter[data-filter]')
        if (!btn) return
        this.setCategory(btn.dataset.filter)
      })
    }
  }
}
