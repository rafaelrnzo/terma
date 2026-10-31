"use client"

import { DropIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

export function WetBulbInspection({ inspecting, onInspect }: { inspecting: boolean; onInspect: () => void }) {
  return <Button variant="outline" size="sm" className="font-sans tracking-normal" aria-pressed={inspecting} onClick={onInspect}>{inspecting ? <MagnifyingGlassMinusIcon /> : <MagnifyingGlassPlusIcon />}{inspecting ? "Kembali ke Station" : "Perbesar wet bulb"}</Button>
}

export function StationAnatomy() {
  return <section className="iot-station-anatomy" aria-label="Bagian pengukur Station">
    <h4>Tiga bagian pengukur</h4>
    <dl><div><dt>Black globe</dt><dd>Bola hitam tetap kering; menangkap pengaruh panas radiasi.</dd></div>
      <div><dt>Natural wet bulb</dt><dd>Sensor bersumbu basah berada di udara. Ujung sumbu masuk ke air pada reservoir.</dd></div>
      <div><dt>Suhu &amp; kelembapan udara</dt><dd>Sensor berada di dalam pelindung berlapis, terpisah dari reservoir.</dd></div></dl>
    <p className="iot-cutaway-note"><DropIcon size={15} />Reservoir ditampilkan dalam potongan untuk memperlihatkan ujung sumbu yang terendam.</p>
  </section>
}
