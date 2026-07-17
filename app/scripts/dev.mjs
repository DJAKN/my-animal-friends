import { spawn } from 'node:child_process'

const children = [
  spawn(process.execPath, ['--env-file-if-exists=.env.local', 'server/dev.js'], { stdio: 'inherit', env: process.env }),
  spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev:web'], { stdio: 'inherit', env: process.env }),
]

let stopping = false
function stop(signal = 'SIGTERM') {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill(signal)
}

for (const child of children) {
  child.on('exit', (code) => {
    if (!stopping) {
      stop()
      process.exitCode = code || 0
    }
  })
}

process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))
