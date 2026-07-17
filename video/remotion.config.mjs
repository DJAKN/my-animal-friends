import { Config } from '@remotion/cli/config'

Config.setEntryPoint('src/index.js')
Config.setVideoImageFormat('jpeg')
Config.setOverwriteOutput(true)

// Allow pointing at a system Chromium (e.g. sandboxes/CI where Remotion
// cannot download its own headless browser).
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER)
}
