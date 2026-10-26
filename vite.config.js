import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import { syncMusic } from './scripts/sync-music.js'

function collectIconNames(root) {
  const srcDir = path.join(root, 'src')
  const files = [
    path.join(root, 'index.html'),
    ...fs.readdirSync(srcDir, { recursive: true }).filter(file => file.endsWith('.js')).map(file => path.join(srcDir, file))
  ]
  const names = new Set()
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8')
    for (const match of source.matchAll(/class="ms[^"]*"[^>]*>([a-z0-9_]+)</g)) {
      names.add(match[1])
    }
    for (const line of source.split('\n')) {
      if (!/icon/i.test(line)) continue
      for (const match of line.matchAll(/'([a-z][a-z0-9_]*)'/g)) {
        names.add(match[1])
      }
    }
  }
  return [...names].sort().join(',')
}

let projectRoot = process.cwd()

export default defineConfig({
  build: {
    assetsInlineLimit: file => (file.endsWith('.woff2') ? false : undefined)
  },
  plugins: [
    {
      name: 'music-sync',
      buildStart() {
        return syncMusic()
      },
      configureServer(server) {
        syncMusic()
        server.watcher.add('public/music/*')
        server.watcher.on('add', file => {
          if (file.includes('public/music') && !file.includes('covers') && !file.endsWith('files.json')) {
            syncMusic()
          }
        })
      }
    },
    {
      name: 'material-symbols-subset',
      configResolved(config) {
        projectRoot = config.root
      },
      transformIndexHtml(html) {
        const icons = collectIconNames(projectRoot)
        return html.replace(/(family=Material\+Symbols\+Rounded[^"]*?)&amp;display=swap/g, `$1&amp;icon_names=${icons}&amp;display=swap`)
      }
    },
    {
      name: 'material-symbols-self-host',
      apply: 'build',
      enforce: 'post',
      async generateBundle(_, bundle) {
        const page = bundle['index.html']
        if (!page) return
        let html = page.source.toString()
        const cssUrl = html.match(/https:\/\/fonts\.googleapis\.com\/css2\?family=Material\+Symbols\+Rounded[^"]*/)?.[0]
        if (!cssUrl) return
        try {
          const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'
          const css = await fetch(cssUrl.replaceAll('&amp;', '&'), { headers: { 'User-Agent': userAgent } }).then(res => {
            if (!res.ok) throw new Error(`fonts.googleapis.com responded ${res.status}`)
            return res.text()
          })
          const fontFace = css.match(/@font-face\s*{[^}]*}/)?.[0]
          const fontUrl = fontFace?.match(/url\(([^)]+)\)/)?.[1]
          if (!fontUrl) throw new Error('no @font-face in Material Symbols stylesheet')
          const font = await fetch(fontUrl).then(res => {
            if (!res.ok) throw new Error(`fonts.gstatic.com responded ${res.status}`)
            return res.arrayBuffer()
          })
          const fileName = this.getFileName(this.emitFile({ type: 'asset', name: 'material-symbols-rounded.woff2', source: new Uint8Array(font) }))
          const localFace = fontFace.replace(fontUrl, `/${fileName}`)
          html = html
            .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>/g, '')
            .replace(/\s*<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Material[^>]*>/, '')
            .replace(/\s*<noscript>\s*<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Material[^>]*>\s*<\/noscript>/, '')
            .replace('</head>', `  <link rel="preload" href="/${fileName}" as="font" type="font/woff2" crossorigin>\n    <style>${localFace}</style>\n  </head>`)
          page.source = html
        } catch (error) {
          this.warn(`Material Symbols kept on Google Fonts: ${error.message}`)
        }
      }
    },
    {
      name: 'inline-css',
      apply: 'build',
      enforce: 'post',
      generateBundle(_, bundle) {
        const page = bundle['index.html']
        if (!page) return
        let html = page.source.toString()
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type !== 'asset' || !fileName.endsWith('.css')) continue
          const link = new RegExp(`<link rel="stylesheet"[^>]*href="/${fileName}"[^>]*>`)
          if (!link.test(html)) continue
          html = html.replace(link, () => `<style>${chunk.source}</style>`)
          delete bundle[fileName]
        }
        page.source = html
      }
    }
  ]
})
