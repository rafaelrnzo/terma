"use client"

import { useId, useState } from "react"
import { CameraIcon } from "@phosphor-icons/react/dist/csr/Camera"
import { ScanIcon } from "@phosphor-icons/react/dist/csr/Scan"
import { VideoCameraSlashIcon } from "@phosphor-icons/react/dist/csr/VideoCameraSlash"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight"
import { Button } from "@/components/ui/button"
import { useKioskCamera } from "./use-kiosk-camera"
import type { CheckinMethod } from "@/lib/kiosk-entry"

export function CameraEntry({ name, demoIdentity = false, onConfirm }: { name?: string; demoIdentity?: boolean; onConfirm: (method: CheckinMethod) => void }) {
  const camera = useKioskCamera()
  const [preview, setPreview] = useState(false)
  const [thermal, setThermal] = useState(true)
  const gradient = useId()
  const opened = camera.status === "live" || preview
  function showPreview() { camera.stop(); setPreview(true) }
  return <div className="camera-entry">
    <div className="kiosk-camera-view" data-active={opened} data-thermal={thermal}>
      <video ref={camera.video} muted playsInline autoPlay aria-label="Pratinjau kamera pekerja" hidden={camera.status !== "live" || preview} />
      {(camera.status !== "live" || preview) && <svg viewBox="0 0 480 340" className="kiosk-camera-silhouette" role="img" aria-label={preview ? "Visualisasi wajah untuk pratinjau kamera termal" : "Panduan posisi wajah"}><defs><radialGradient id={gradient}><stop offset="0" stopColor="var(--status-adaptasi)" /><stop offset=".55" stopColor="var(--status-batasi)" /><stop offset="1" stopColor="var(--chart-2)" /></radialGradient></defs><ellipse cx="240" cy="142" rx="56" ry="72" fill={preview && thermal ? `url(#${gradient})` : "var(--secondary)"} /><path d="M126 321c0-66 37-112 73-120q41 30 82 0c36 8 73 54 73 120Z" fill={preview && thermal ? `url(#${gradient})` : "var(--secondary)"} />{preview && <g fill="var(--card)" opacity=".45"><ellipse cx="220" cy="139" rx="8" ry="5" /><ellipse cx="260" cy="139" rx="8" ry="5" /></g>}</svg>}
      {camera.status === "live" && thermal && !preview && <div className="kiosk-thermal-overlay" aria-hidden />}
      <div className="camera-face-frame" aria-hidden><span /><span /><span /><span />{opened && <i />}</div>
      <span className="camera-view-label"><ScanIcon size={15} />{preview ? "Pratinjau visual" : camera.status === "live" ? "Kamera aktif" : camera.status === "starting" ? "Menunggu izin kamera…" : "Posisikan wajah di dalam bingkai"}</span>
      {camera.status === "idle" && !preview && <span className="camera-standby"><CameraIcon size={34} />Kamera belum dibuka</span>}
    </div>
    <div className="camera-mode-switch" role="group" aria-label="Tampilan kamera"><Button size="sm" variant="ghost" aria-pressed={thermal} onClick={() => setThermal(true)}>Efek termal</Button><Button size="sm" variant="ghost" aria-pressed={!thermal} onClick={() => setThermal(false)}>Normal</Button></div>
    <p className="kiosk-device-note">{demoIdentity ? `Kamera menampilkan pratinjau; identitas ${name} berasal dari akun yang masuk, bukan pengenalan wajah. Efek termal hanya visual.` : "Efek termal hanya visual, bukan ukur suhu."}</p>
    {camera.error && <p role="alert" className="kiosk-entry-error"><VideoCameraSlashIcon size={18} />{camera.error}</p>}
    {opened ? <div className="kiosk-entry-actions"><Button disabled={!name} onClick={() => { camera.stop(); onConfirm(preview ? "PRATINJAU_KAMERA" : "KAMERA") }}>{name ? demoIdentity ? `Lanjut sebagai ${name}` : `Ya, saya ${name}` : "Pilih nama pekerja untuk melanjutkan"}<ArrowRightIcon /></Button><Button variant="ghost" onClick={() => { camera.stop(); setPreview(false) }}>Tutup kamera</Button></div> : <div className="kiosk-entry-actions"><Button onClick={() => { setPreview(false); void camera.start() }} disabled={camera.status === "starting"}><CameraIcon />{camera.status === "starting" ? "Membuka kamera…" : camera.status === "error" ? "Coba buka kamera lagi" : "Buka kamera"}</Button><Button variant="outline" onClick={showPreview}>Pratinjau tanpa kamera</Button>{camera.status === "starting" && <Button variant="ghost" onClick={camera.stop}>Batalkan</Button>}</div>}
  </div>
}
