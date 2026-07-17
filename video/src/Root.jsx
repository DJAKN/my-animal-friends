import { Composition } from 'remotion'
import { Opening } from './scenes/Opening.jsx'

export function Root() {
  return (
    <Composition
      id="Opening"
      component={Opening}
      durationInFrames={260}
      fps={30}
      width={1920}
      height={1080}
    />
  )
}
