import { terminalCommand, homelabNodes, homelabSummary } from '../data/homelab.js'

export class TerminalManager {
  constructor() {
    this.cmdEl = document.getElementById('term-cmd')
    this.nodeListEl = document.getElementById('node-list')
    this.footEl = document.getElementById('term-foot')

    this.renderNodes()
    this.startTypewriter()
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
            <span class="node-role">${node.role}</span>
          </div>
          <span class="node-kind mono" data-kind="${node.kind}">${node.kind}</span>
        </li>
      `
      })
      .join('')
  }

  startTypewriter() {
    if (!this.cmdEl) return

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

  revealNodes() {
    if (!this.nodeListEl) return
    const nodes = this.nodeListEl.querySelectorAll('.node')
    nodes.forEach((node, idx) => {
      setTimeout(() => {
        node.classList.add('is-shown')
      }, idx * 60)
    })

    if (this.footEl) {
      setTimeout(() => {
        this.footEl.textContent = homelabSummary
      }, nodes.length * 60 + 100)
    }
  }
}
