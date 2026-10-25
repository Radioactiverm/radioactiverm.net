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

export async function syncMusic() {
  if (!fs.existsSync(publicMusicDir)) return
  if (!fs.existsSync(publicCoversDir)) {
    fs.mkdirSync(publicCoversDir, { recursive: true })
  }

  let existingList = []
  if (fs.existsSync(filesJsonPath)) {
    try {
      const raw = fs.readFileSync(filesJsonPath, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) existingList = parsed
    } catch {}
  }

  for (const f of fs.readdirSync(publicMusicDir)) {
    if (f.includes('#')) {
      const clean = f.replace(/#/g, '').trim()
      if (clean && clean !== f) {
        fs.renameSync(path.join(publicMusicDir, f), path.join(publicMusicDir, clean))
        const baseOld = path.basename(f, path.extname(f))
        const baseClean = path.basename(clean, path.extname(clean))
        const oldCover = path.join(publicCoversDir, `${baseOld}.jpg`)
        const newCover = path.join(publicCoversDir, `${baseClean}.jpg`)
        if (fs.existsSync(oldCover)) {
          fs.renameSync(oldCover, newCover)
        }
      }
    }
  }

  existingList = existingList.map(item => {
    if (typeof item === 'string') {
      return item.replace(/#/g, '').trim()
    }
    if (item && item.file) {
      return { ...item, file: item.file.replace(/#/g, '').trim() }
    }
    return item
  })

  const existingFileNames = new Set(
    existingList.map(item => (typeof item === 'string' ? item : item.file))
  )

  const dirFiles = fs.readdirSync(publicMusicDir)
  const dirAudioFiles = dirFiles.filter(f =>
    audioExtensions.has(path.extname(f).toLowerCase())
  )

  const updatedList = []
  for (const item of existingList) {
    const filename = typeof item === 'string' ? item : item.file
    if (dirAudioFiles.includes(filename)) {
      const filePath = path.join(publicMusicDir, filename)
      const base = path.basename(filename, path.extname(filename))
      const coverPath = path.join(publicCoversDir, `${base}.jpg`)

      let bpm = typeof item === 'object' && item.bpm ? item.bpm : null

      try {
        const metadata = await parseFile(filePath)
        if (!fs.existsSync(coverPath) && metadata.common.picture && metadata.common.picture.length > 0) {
          fs.writeFileSync(coverPath, metadata.common.picture[0].data)
        }
        if (!bpm && metadata.common.bpm) {
          bpm = Math.round(Number(metadata.common.bpm))
        }
      } catch {}

      if (!bpm) {
        bpm = await detectBpm(filePath)
      }

      updatedList.push({ file: filename, bpm: bpm || 120 })
    }
  }

  for (const f of dirAudioFiles) {
    if (!existingFileNames.has(f)) {
      const filePath = path.join(publicMusicDir, f)
      const base = path.basename(f, path.extname(f))
      const coverPath = path.join(publicCoversDir, `${base}.jpg`)
      let bpm = null

      try {
        const metadata = await parseFile(filePath)
        if (!fs.existsSync(coverPath) && metadata.common.picture && metadata.common.picture.length > 0) {
          fs.writeFileSync(coverPath, metadata.common.picture[0].data)
        }
        if (metadata.common.bpm) {
          bpm = Math.round(Number(metadata.common.bpm))
        }
      } catch {}

      if (!bpm) {
        bpm = await detectBpm(filePath)
      }

      updatedList.push({ file: f, bpm: bpm || 120 })
    }
  }

  fs.writeFileSync(filesJsonPath, JSON.stringify(updatedList, null, 2) + '\n', 'utf-8')

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

    for (const a of dirAudioFiles) {
      const src = path.join(publicMusicDir, a)
      const dest = path.join(distMusicDir, a)
      if (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs) {
        fs.copyFileSync(src, dest)
      }
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncMusic()
}
