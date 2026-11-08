"use client"

import { useEffect, useRef, useState } from "react"
import { QrCodeIcon } from "@phosphor-icons/react/dist/csr/QrCode"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Detector = { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> }
type DetectorConstructor = new (options: { formats: string[] }) => Detector

/** The browser's built-in QR reader (Chrome on Android/desktop); absent elsewhere. */
function nativeDetector() {
  // SAFETY: BarcodeDetector is not in TypeScript's DOM types yet; it is read as an optional constructor and checked before use.
  const Constructor = (globalThis as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector
  return Constructor ? new Constructor({ formats: ["qr_code"] }) : null
}

/** Opens the camera and returns the first QR value read. Manual buttons stay available where scanning is unsupported. */
export function QrScanButton({ label, onCode }: { label: string; onCode: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const video = useRef<HTMLVideoElement>(null)
  const latest = useRef(onCode)
  useEffect(() => { latest.current = onCode }, [onCode])
  useEffect(() => {
    const detector = open && !error ? nativeDetector() : null
    if (!detector) return
    let stream: MediaStream | undefined
    let timer = 0
    let stopped = false
    void navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(media => {
      if (stopped) { media.getTracks().forEach(track => track.stop()); return }
      stream = media
      if (video.current) { video.current.srcObject = media; void video.current.play() }
      timer = window.setInterval(() => {
        if (!video.current || video.current.readyState < 2) return
        void detector.detect(video.current).then(codes => {
          const value = codes[0]?.rawValue
          if (value && !stopped) { stopped = true; setOpen(false); latest.current(value.trim()) }
        }).catch(() => undefined) // a frame that cannot be read is simply skipped
      }, 300)
    }).catch(() => setError("Izin kamera ditolak. Izinkan kamera di browser, atau gunakan tombol di daftar."))
    return () => { stopped = true; window.clearInterval(timer); stream?.getTracks().forEach(track => track.stop()) }
  }, [open, error])
  return <>
    <Button size="sm" variant="outline" onClick={() => { setError(nativeDetector() ? "" : "Browser ini belum mendukung scan QR. Gunakan Chrome di HP, atau tombol di daftar."); setOpen(true) }}><QrCodeIcon />{label}</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>{label}</DialogTitle><DialogDescription>Arahkan kamera ke QR pada Band.</DialogDescription></DialogHeader>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <video ref={video} muted playsInline className="aspect-square w-full rounded-md bg-black object-cover" aria-label="Kamera untuk scan QR Band" />}
      </DialogContent>
    </Dialog>
  </>
}
