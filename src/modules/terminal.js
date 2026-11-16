import { terminalCommand, homelabNodes, homelabSummary } from '../data/homelab.js'

export class TerminalManager {
  constructor() {
    this.cardEl = document.getElementById('card-homelab')
    this.cmdEl = document.getElementById('term-cmd')
    this.nodeListEl = document.getElementById('node-list')
    this.footEl = document.getElementById('term-foot')
    this.started = false

    this.renderNodes()
    this.startWhenVisible()
  }

  renderNodes() {
    if (!this.nodeListEl) return

    this.nodeListEl.innerHTML = homelabNodes
      .map(node => {
        return `
        <li class="node" data-kind="${node.kind}">
          <span class="node-icon"><span class="ms" aria-hidden="true">${node.icon}</span></span>
          <div class="node-main">
            <span class="node-name">${node.name}</span>
            <span class="node-role" title="${node.role}">${node.role}</span>
          </div>
          <span class="node-kind mono" data-kind="${node.kind}">${node.kind}</span>
        </li>
      `
      })
      .join('')
  }

  startWhenVisible() {
    const target = this.cardEl || this.nodeListEl
    if (!target || typeof IntersectionObserver === 'undefined') {
      this.start()
      return
    }

    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return
        observer.disconnect()
        this.start()
      },
      { threshold: 0.15 }
    )
    observer.observe(target)
  }

  start() {
    if (this.started) return
    this.started = true

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (this.cmdEl) this.cmdEl.textContent = terminalCommand
      this.revealNodes(0)
      return
    }

    this.startTypewriter()
  }

  startTypewriter() {
    if (!this.cmdEl) {
      this.revealNodes()
      return
    }

    let i = 0
    const text = terminalCommand
    this.cmdEl.textContent = ''

    const type = () => {
      if (i < text.length) {
        this.cmdEl.textContent += text[i]
        i++
        setTimeout(type, 35)
      } else {
        this.revealNodes()
      }
    }

    setTimeout(type, 400)
  }

  revealNodes(step = 60) {
    if (!this.nodeListEl) return
    const nodes = this.nodeListEl.querySelectorAll('.node')
    nodes.forEach((node, idx) => {
      setTimeout(() => {
        node.classList.add('is-shown')
      }, idx * step)
    })

    if (this.footEl) {
      setTimeout(() => {
        this.footEl.textContent = homelabSummary
      }, nodes.length * step + (step ? 100 : 0))
    }
  }
}
