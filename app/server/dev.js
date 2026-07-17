import http from 'node:http'

import { createBirdSoundHandler, createWalkHandler } from './httpHandlers.js'

const port = Number(process.env.API_PORT || 8787)
const handlers = {
  '/api/walk': createWalkHandler(),
  '/api/bird-sounds': createBirdSoundHandler(),
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname
  const handler = handlers[pathname]
  if (!handler) {
    res.statusCode = 404
    res.end('Not found')
    return
  }
  try {
    req.body = await readBody(req)
    await handler(req, res)
  } catch {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Invalid JSON request' }))
  }
})

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Local API listening on http://127.0.0.1:${port}\n`)
})

function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return Promise.resolve(null)
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 1_000_000) {
        reject(new Error('Request too large'))
        req.destroy()
      } else chunks.push(chunk)
    })
    req.on('end', () => {
      if (!chunks.length) return resolve(null)
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
      catch (error) { reject(error) }
    })
    req.on('error', reject)
  })
}
