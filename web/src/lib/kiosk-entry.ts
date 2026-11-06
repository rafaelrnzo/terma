export const CHECKIN_METHOD_LABEL = {
  KAMERA: "Kamera · identitas dikonfirmasi",
  PRATINJAU_KAMERA: "Pratinjau kamera",
  TAP_KARTU: "Tap kartu di kios",
}
export type CheckinMethod = keyof typeof CHECKIN_METHOD_LABEL

export function isCheckinMethod(value: unknown): value is CheckinMethod {
  return value === "KAMERA" || value === "PRATINJAU_KAMERA" || value === "TAP_KARTU"
}

export function cameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") return "Izin kamera belum diberikan. Izinkan akses kamera di browser, atau gunakan pratinjau dan tap kartu."
    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") return "Kamera tidak ditemukan. Sambungkan kamera, atau gunakan pratinjau dan tap kartu."
    if (error.name === "NotReadableError") return "Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba lagi."
  }
  return "Kamera belum dapat dibuka. Coba lagi, gunakan pratinjau, atau pilih tap kartu."
}
