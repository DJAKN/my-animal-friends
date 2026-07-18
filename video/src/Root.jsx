import { Composition } from 'remotion'
import { Opening } from './scenes/Opening.jsx'
import { RouteFlythrough } from './scenes/RouteFlythrough.jsx'

export function Root() {
  return (
    <>
      <Composition
        id="Opening"
        component={Opening}
        durationInFrames={260}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RouteFlythrough"
        component={RouteFlythrough}
        durationInFrames={780}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  )
}
