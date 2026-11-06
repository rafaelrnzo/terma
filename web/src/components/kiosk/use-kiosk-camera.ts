"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cameraErrorMessage } from "@/lib/kiosk-entry"

type CameraStatus = "idle" | "starting" | "live" | "error"

export function useKioskCamera() {
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const request = useRef(0)
  const [status, setStatus] = useState<CameraStatus>("idle")
  const [error, setError] = useState("")
  const release = useCallback(() => {
    request.current++
    stream.current?.getTracks().forEach(track => track.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
  }, [])
  const stop = useCallback(() => { release(); setStatus("idle"); setError("") }, [release])
  useEffect(() => {
    const hidden = () => { if (document.hidden) stop() }
    document.addEventListener("visibilitychange", hidden)
    return () => { document.removeEventListener("visibilitychange", hidden); release() }
  }, [release, stop])
  async function start() {
    release()
    const current = request.current
    setError("")
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error")
      setError("Browser ini belum mendukung kamera. Gunakan HTTPS, pratinjau, atau tap kartu.")
      return
    }
    setStatus("starting")
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      if (current !== request.current || !video.current) { media.getTracks().forEach(track => track.stop()); return }
      stream.current = media
      video.current.srcObject = media
      await video.current.play()
      if (current === request.current) setStatus("live")
    } catch (failure) {
      if (current !== request.current) return
      release()
      setStatus("error")
      setError(cameraErrorMessage(failure))
    }
  }
  return { video, status, error, start, stop }
}
