import { DEVICE_ART } from "./generated-art"
import { IotLive } from "./live"

export function IotFigure() {
  // SAFETY: geometry is generated locally from the Anatomy kit; no user content enters the SVG markup.
  const art = <g key="terma-instruments" dangerouslySetInnerHTML={{ __html: DEVICE_ART }} />
  return <IotLive art={art} />
}
