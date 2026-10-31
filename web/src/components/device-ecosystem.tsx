import { ThermometerIcon, DropIcon, HeartbeatIcon } from "@phosphor-icons/react/ssr"

const devices = [
  { name: "TERMA Station", Icon: ThermometerIcon, placement: "SATU PER ZONA KERJA", description: "Membaca tekanan panas di tempat pekerja beraktivitas, sebagai dasar rencana kerja harian.", specs: [["Pengukuran", "WBGT / ISBB · ±5 menit"], ["Sensor", "Globe, wet bulb, suhu & RH"], ["Kontroler", "ESP32"], ["Koneksi", "Wi-Fi / 4G / LoRa"], ["Daya", "Surya + baterai"]] },
  { name: "Smart Water Station", Icon: DropIcon, placement: "DI TITIK AIR MINUM", description: "Tap kartu mencatat kunjungan pekerja ke tempat minum tanpa memerlukan smartphone.", specs: [["Identifikasi", "RFID / QR"], ["Keluaran", "ID pekerja & waktu tap"], ["Kontroler", "ESP32"], ["Koneksi", "Wi-Fi"], ["Umpan balik", "LED + buzzer"]] },
  { name: "TERMA Band", Icon: HeartbeatIcon, placement: "BERGILIR, SESUAI RISIKO", description: "Band lengan atas untuk beberapa pekerja paling berisiko. Estimasi suhu inti menggunakan deret detak jantung.", specs: [["Sensor", "PPG, suhu kulit & gerak"], ["Keluaran", "Estimasi suhu inti"], ["Kontroler", "ESP32-C3 / nRF52"], ["Koneksi", "BLE ke gateway"], ["Target baterai", "Satu shift penuh"]] },
]

export function DeviceEcosystem() {
  return <div className="device-grid">{devices.map(device => <article key={device.name} className="summon-panel device-card"><div className="flex items-center justify-between gap-3"><span className="device-icon"><device.Icon size={24} weight="duotone" /></span><span className="connected-note"><span className="status-dot" />Spesifikasi proposal</span></div><p className="mt-5 text-xs font-medium tracking-wide text-muted-foreground">{device.placement}</p><h2>{device.name}</h2><p>{device.description}</p><dl className="device-specs">{device.specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></article>)}</div>
}
