import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/wordmark"

export default function Home() {
  return <div className="intro-shell">
    <header className="intro-header">
      <Wordmark href="/" />
      <nav aria-label="Pengantar" className="flex items-center gap-3 sm:gap-6">
        <a href="#cara-kerja" className="text-sm text-muted-foreground hover:text-foreground">Cara kerja</a>
        <Button asChild variant="outline"><Link href="/ringkasan">Buka ruang kerja<ArrowRight aria-hidden /></Link></Button>
      </nav>
    </header>
    <main id="main-content">
      <section className="intro-hero" aria-labelledby="intro-title">
        <div className="intro-copy">
          <h1 id="intro-title">Panas di lapangan.<br /><span className="text-primary">Rencana yang jelas.</span></h1>
          <p className="intro-description">TERMA membantu petugas HSE dan mandor mengatur paparan panas pekerja—dari meninjau kondisi lapangan, menyusun rencana kerja-istirahat, hingga memeriksa pelaksanaannya.</p>
          <Button asChild size="lg" className="mt-8 h-auto min-h-12 whitespace-normal py-3"><Link href="/ringkasan">Masuk ke pekerjaan hari ini<ArrowRight className="shrink-0" aria-hidden /></Link></Button>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">Coba sebagai HSE, lalu ganti peran menjadi mandor di ruang kerja. Data contoh sudah tersedia.</p>
        </div>
        <aside className="intro-handoff" aria-label="Contoh alur koordinasi">
          <h2 className="font-heading text-2xl font-medium">Satu rencana,<br />sampai selesai di lapangan.</h2>
          <p className="mt-3 text-sm text-muted-foreground">Contoh alur dalam simulasi</p>
          <ol className="handoff-list">
            <li><span className="handoff-node" aria-hidden>1</span><div><p className="font-medium">HSE menyiapkan rencana</p><p className="mt-1 text-sm text-muted-foreground">Tinjau data panas dan kebutuhan tiap pekerja.</p></div></li>
            <li><span className="handoff-node" aria-hidden>2</span><div><p className="font-medium">Mandor melaksanakan</p><p className="mt-1 text-sm text-muted-foreground">Terima instruksi, lalu catat durasi kerja aktual.</p></div></li>
            <li><span className="handoff-node" aria-hidden>3</span><div><p className="font-medium">HSE memverifikasi</p><p className="mt-1 text-sm text-muted-foreground">Periksa laporan sebelum menutup tindakan.</p></div></li>
          </ol>
        </aside>
      </section>
      <section id="cara-kerja" className="intro-how" aria-labelledby="how-title">
        <h2 id="how-title" className="font-heading text-2xl font-medium sm:text-3xl">Mulai dari yang perlu<br className="hidden sm:block" /> Anda kerjakan.</h2>
        <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
          <p><strong className="font-medium text-foreground">Halaman “Hari ini” menunjukkan langkah berikutnya.</strong> Buka tugas yang belum lengkap, bukan mencari sendiri di seluruh menu.</p>
          <p><strong className="font-medium text-foreground">Setiap peran punya lingkup kerja.</strong> HSE meninjau seluruh lokasi; mandor melihat regunya. Pemilih peran memungkinkan Anda mencoba kedua sisi alur.</p>
          <p><strong className="font-medium text-foreground">Perlu rincian?</strong> Buka profil pekerja untuk meninjau alasan, jadwal per jam, dan persetujuan rencana.</p>
        </div>
      </section>
    </main>
    <footer className="intro-footer"><p>Demo dengan data simulasi. Bukan untuk keputusan operasional atau diagnosis medis; aturan perhitungan belum disahkan HSE.</p><Link href="/panduan" className="shrink-0 underline underline-offset-4">Panduan & batas demo</Link></footer>
  </div>
}
