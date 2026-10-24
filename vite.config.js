import { defineConfig } from 'vite'
import { syncMusic } from './scripts/sync-music.js'

export default defineConfig({
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
    }
  ]
})
