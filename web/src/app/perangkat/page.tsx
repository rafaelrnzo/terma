import Link from "next/link"
import { ArrowRightIcon, CpuIcon, CloudIcon, BrainIcon, MonitorIcon, ArrowUpRightIcon } from "@phosphor-icons/react/ssr"
import { DeviceWorkflowContext } from "@/components/device-workflow-context"
import { IotFigure } from "@/components/figures/terma/figure"
import { DeviceEcosystem } from "@/components/device-ecosystem"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"

export default function DevicesPage() {
  return <>
    <PageHeader title="Ekosistem perangkat IoT" summary="Tiga perangkat, satu gambaran lapangan. Menghubungkan panas lingkungan, kebiasaan minum, dan respons tubuh dengan rencana personal." />
    <DeviceWorkflowContext />
    <IotFigure />
    <details className="mt-6"><summary className="cursor-pointer text-sm font-medium">Spesifikasi dan penempatan perangkat</summary><div className="mt-4"><DeviceEcosystem /></div></details>
    <section className="summon-panel mt-6"><div className="panel-heading"><div><h2>Dari lapangan ke tindakan</h2><p>Station → Gateway → Rencana → Tindak lanjut</p></div></div><div className="connection-flow"><div><CpuIcon size={26} className="mx-auto text-primary" /><strong>Perangkat</strong><small>Station · water · band</small></div><ArrowRightIcon className="text-muted-foreground" /><div><CloudIcon size={26} className="mx-auto text-primary" /><strong>Gateway & cloud</strong><small>MQTT / HTTPS</small></div><ArrowRightIcon className="text-muted-foreground" /><div><BrainIcon size={26} className="mx-auto text-primary" /><strong>Aturan + AI personal</strong><small>Aturan aktif · model AI direncanakan</small></div><ArrowRightIcon className="text-muted-foreground" /><div><MonitorIcon size={26} className="mx-auto text-primary" /><strong>HSE, mandor & klinik</strong><small>Rencana · instruksi · rujukan</small></div></div></section>
    <div className="mt-6 grid gap-5 md:grid-cols-2"><section className="summon-panel p-6"><h2 className="text-sm font-semibold">Koneksi hilang, data tetap dapat ditelusuri.</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Rancangan perangkat menyimpan pembacaan secara lokal dan mengirim ulang saat koneksi pulih. Di aplikasi, interval tanpa bacaan tetap ditandai kosong.</p><Button asChild variant="outline" className="mt-5"><Link href="/ringkasan">Buka alur shift<ArrowUpRightIcon /></Link></Button></section><section className="summon-panel p-6"><h2 className="text-sm font-semibold">Ada batas pada apa yang diukur.</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Tap RFID mencatat kunjungan, bukan volume air yang diminum. Suhu inti dari band adalah estimasi yang memerlukan validasi. Fungsi ginjal diperiksa oleh klinik.</p><Button asChild variant="outline" className="mt-5"><Link href="/kesehatan">Paparan & rujukan klinik<ArrowUpRightIcon /></Link></Button></section></div>
  </>
}
