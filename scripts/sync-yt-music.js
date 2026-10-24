import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import { parseFile } from 'music-metadata'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const publicMusicDir = path.join(projectRoot, 'public', 'music')
const publicCoversDir = path.join(publicMusicDir, 'covers')
const filesJsonPath = path.join(publicMusicDir, 'files.json')

const distMusicDir = path.join(projectRoot, 'dist', 'music')
const distCoversDir = path.join(distMusicDir, 'covers')
const distFilesJsonPath = path.join(distMusicDir, 'files.json')

const playlistUrl =
  process.env.YT_PLAYLIST_URL ||
  'https://music.youtube.com/playlist?list=PLLnsDJbkY6I4'

const audioExtensions = new Set([
  '.opus',
  '.m4a',
  '.mp3',
  '.flac',
  '.ogg',
  '.wav',
  '.aac',
  '.webm'
])

function runProcess(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    p.stdout.on('data', d => {
      stdout += d.toString()
    })
    p.stderr.on('data', d => {
      stderr += d.toString()
    })
    p.on('error', err => reject(err))
    p.on('close', code => {
      if (code === 0) resolve(stdout)
      else reject(new Error(stderr || `Process exited with code ${code}`))
    })
  })
}

function normalizeTitle(name) {
  let clean = name.replace(/\.[^/.]+$/, '')
  clean = clean.replace(/\(feat\.[^)]+\)/gi, '')
  clean = clean.replace(/\[feat\.[^\]]+\]/gi, '')
  clean = clean.replace(/[\s_]+/g, ' ').trim().toLowerCase()
  return clean
}

function detectBpm(filePath) {
  return new Promise(resolve => {
    const ff = spawn(
      'ffmpeg',
      ['-y', '-i', filePath, '-vn', '-ac', '1', '-ar', '22050', '-t', '45', '-f', 'f32le', 'pipe:1'],
      { stdio: ['ignore', 'pipe', 'ignore'] }
    )
    const chunks = []
    ff.stdout.on('data', chunk => chunks.push(chunk))
    ff.on('error', () => resolve(120))
    ff.on('close', code => {
      if (code !== 0 || chunks.length === 0) return resolve(120)
      const buf = Buffer.concat(chunks)
      const numSamples = Math.floor(buf.length / 4)
      if (numSamples < 22050 * 5) return resolve(120)

      const hop = 441
      const numFrames = Math.floor(numSamples / hop)
      const energy = new Float32Array(numFrames)

      for (let i = 0; i < numFrames; i++) {
        let sum = 0
        const offset = i * hop * 4
        for (let j = 0; j < hop; j++) {
          const s = buf.readFloatLE(offset + j * 4)
          sum += s * s
        }
        energy[i] = sum / hop
      }

      const flux = new Float32Array(numFrames)
      let totalFlux = 0
      for (let i = 1; i < numFrames; i++) {
        const diff = energy[i] - energy[i - 1]
        const val = diff > 0 ? diff : 0
        flux[i] = val
        totalFlux += val
      }

      const avgFlux = totalFlux / numFrames
      for (let i = 0; i < numFrames; i++) {
        flux[i] = Math.max(0, flux[i] - avgFlux)
      }

      const frameRate = 22050 / hop
      const minBpm = 60
      const maxBpm = 180
      const minLag = Math.floor((frameRate * 60) / maxBpm)
      const maxLag = Math.floor((frameRate * 60) / minBpm)

      let bestCorr = 0
      let bestLag = minLag
      for (let lag = minLag; lag <= maxLag; lag++) {
        let corr = 0
        for (let i = lag; i < numFrames; i++) {
          corr += flux[i] * flux[i - lag]
        }
        if (corr > bestCorr) {
          bestCorr = corr
          bestLag = lag
        }
      }
      const bpm = Math.round((frameRate * 60) / bestLag)
      resolve(bpm >= 60 && bpm <= 200 ? bpm : 120)
    })
  })
}

async function downloadThumbnail(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) return false
  const arrayBuffer = await res.arrayBuffer()
  await fs.promises.writeFile(destPath, Buffer.from(arrayBuffer))
  return true
}

export async function syncYtMusic() {
  if (!fs.existsSync(publicMusicDir)) {
    fs.mkdirSync(publicMusicDir, { recursive: true })
  }
  if (!fs.existsSync(publicCoversDir)) {
    fs.mkdirSync(publicCoversDir, { recursive: true })
  }

  let playlistData
  try {
    const raw = await runProcess('yt-dlp', [
      '--flat-playlist',
      '--dump-single-json',
      '--no-warnings',
      playlistUrl
    ])
    playlistData = JSON.parse(raw)
  } catch (err) {
    return
  }

  const entries = playlistData.entries || []
  if (!Array.isArray(entries) || entries.length === 0) return

  const dirFiles = fs.readdirSync(publicMusicDir)
  const existingAudioFiles = dirFiles.filter(f =>
    audioExtensions.has(path.extname(f).toLowerCase())
  )

  const existingByNormTitle = new Map()
  for (const f of existingAudioFiles) {
    existingByNormTitle.set(normalizeTitle(f), f)
  }

  let existingList = []
  if (fs.existsSync(filesJsonPath)) {
    try {
      const raw = fs.readFileSync(filesJsonPath, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) existingList = parsed
    } catch {}
  }

  const existingBpmMap = new Map()
  for (const item of existingList) {
    const name = typeof item === 'string' ? item : item.file
    if (typeof item === 'object' && item.bpm) {
      existingBpmMap.set(name, item.bpm)
    }
  }

  const newOrderedPlaylist = []

  for (const entry of entries) {
    const title = entry.title || ''
    const id = entry.id
    if (!title && !id) continue

    const norm = normalizeTitle(title)
    let matchedFile = existingByNormTitle.get(norm)

    if (!matchedFile) {
      for (const [key, f] of existingByNormTitle.entries()) {
        if (norm.includes(key) || key.includes(norm)) {
          matchedFile = f
          break
        }
      }
    }

    if (!matchedFile) {
      const outTemplate = path.join(publicMusicDir, '%(title)s.%(ext)s')
      const trackUrl = entry.url || `https://www.youtube.com/watch?v=${id}`
      try {
        await runProcess('yt-dlp', [
          '-x',
          '--audio-format',
          'opus',
          '--no-warnings',
          '--embed-metadata',
          '-o',
          outTemplate,
          trackUrl
        ])
        const afterFiles = fs.readdirSync(publicMusicDir)
        const newAudio = afterFiles.filter(f =>
          audioExtensions.has(path.extname(f).toLowerCase())
        )
        const newlyAdded = newAudio.find(f => !existingAudioFiles.includes(f))
        if (newlyAdded) {
          matchedFile = newlyAdded
          existingAudioFiles.push(newlyAdded)
          existingByNormTitle.set(normalizeTitle(newlyAdded), newlyAdded)
        }
      } catch {}
    }

    if (matchedFile) {
      const base = path.basename(matchedFile, path.extname(matchedFile))
      const coverPath = path.join(publicCoversDir, `${base}.jpg`)

      if (!fs.existsSync(coverPath)) {
        let thumbFound = false
        if (entry.thumbnails && Array.isArray(entry.thumbnails) && entry.thumbnails.length > 0) {
          const sorted = [...entry.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0))
          for (const t of sorted) {
            if (t.url) {
              const ok = await downloadThumbnail(t.url, coverPath).catch(() => false)
              if (ok) {
                thumbFound = true
                break
              }
            }
          }
        }
        if (!thumbFound) {
          try {
            const meta = await parseFile(path.join(publicMusicDir, matchedFile))
            if (meta.common.picture && meta.common.picture.length > 0) {
              fs.writeFileSync(coverPath, meta.common.picture[0].data)
            }
          } catch {}
        }
      }

      let bpm = existingBpmMap.get(matchedFile)
      if (!bpm) {
        bpm = await detectBpm(path.join(publicMusicDir, matchedFile))
      }

      newOrderedPlaylist.push({
        file: matchedFile,
        bpm: bpm || 120
      })
    }
  }

  if (newOrderedPlaylist.length > 0) {
    fs.writeFileSync(
      filesJsonPath,
      JSON.stringify(newOrderedPlaylist, null, 2) + '\n',
      'utf-8'
    )

    if (fs.existsSync(distMusicDir)) {
      if (!fs.existsSync(distCoversDir)) {
        fs.mkdirSync(distCoversDir, { recursive: true })
      }
      fs.copyFileSync(filesJsonPath, distFilesJsonPath)

      const coverFiles = fs.readdirSync(publicCoversDir)
      for (const c of coverFiles) {
        const src = path.join(publicCoversDir, c)
        const dest = path.join(distCoversDir, c)
        if (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs) {
          fs.copyFileSync(src, dest)
        }
      }

      for (const item of newOrderedPlaylist) {
        const src = path.join(publicMusicDir, item.file)
        const dest = path.join(distMusicDir, item.file)
        if (fs.existsSync(src)) {
          if (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs) {
            fs.copyFileSync(src, dest)
          }
        }
      }
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncYtMusic()
}
