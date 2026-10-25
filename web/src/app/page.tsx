import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/wordmark"
import { QualityBadge, StatusChip } from "@/components/status"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "TERMA — Kenali alur pengelolaan paparan panas kerja",
  description: "Kenali fitur dan alur TERMA: data pekerja, adaptasi, pengukuran panas, rencana kerja-istirahat, instruksi mandor, verifikasi, dan laporan. Coba dengan data simulasi.",
}

const stages = [
  {
    title: "Siapkan kondisi awal",
    description: "Kenali siapa yang bekerja, penugasannya, dan sumber bacaan panas di lokasi.",
    steps: [
      { no: 1, title: "Data pekerja & penugasan", description: "Impor CSV pekerja dan kehadiran. Telusuri regu, tugas, zona, serta profil setiap pekerja.", href: "/impor" },
      { no: 2, title: "Riwayat & adaptasi", description: "Tinjau kandidat adaptasi dan konfirmasi riwayat paparan sebelum menghitung rencana.", href: "/paparan" },
      { no: 3, title: "Pengukuran panas", description: "Catat atau impor WBGT/ISBB per zona dan jam. Bedakan pengukuran, replay, prakiraan, dan data yang belum tersedia.", href: "/pengukuran" },
    ],
  },
  {
    title: "Tentukan rencana kerja",
    description: "HSE memeriksa kebutuhan tiap pekerja sebelum rencana diteruskan ke mandor.",
    steps: [
      { no: 4, title: "Rencana & persetujuan HSE", description: "Lihat batas harian, jadwal kerja-istirahat per jam, dan alasan perhitungan. Ubah penugasan atau setujui versi rencana yang ditinjau.", href: "/rencana" },
      { no: 5, title: "Instruksi untuk mandor", description: "Siapkan pesan per regu, catat pembagian manual, lalu minta mandor mengakui penerimaannya. WhatsApp dalam demo hanya berupa pratinjau.", href: "/instruksi" },
    ],
  },
  {
    title: "Catat hingga terverifikasi",
    description: "Pisahkan yang direncanakan, yang dilaporkan, dan yang sudah diperiksa HSE.",
    steps: [
      { no: 6, title: "Pelaksanaan & verifikasi", description: "Mandor mencatat durasi aktual dan tindakan regunya. HSE memeriksa laporan dan mencatat hasil verifikasi.", href: "/tindakan" },
      { no: 7, title: "Laporan & jejak aktivitas", description: "Baca rekap tanggal terpilih, tindak lanjut, dan riwayat aktivitas. Cetak laporan untuk meninjau hasil simulasi.", href: "/laporan" },
    ],
  },
]

const roles = [
  { name: "Petugas data", purpose: "Menyiapkan dasar rencana.", tasks: "Memasukkan pekerja, penugasan, kehadiran, serta bacaan panas. Memeriksa data yang belum lengkap.", output: "Data awal untuk ditinjau HSE." },
  { name: "Petugas HSE", purpose: "Meninjau dan mengambil keputusan.", tasks: "Mengonfirmasi adaptasi, meninjau rencana, memberi persetujuan, dan memverifikasi laporan mandor.", output: "Rencana yang ditinjau dan tindak lanjut yang diperiksa." },
  { name: "Mandor", purpose: "Menghubungkan rencana dengan pelaksanaan.", tasks: "Menerima instruksi untuk regunya, mengakui penerimaan, lalu mencatat durasi dan tindakan aktual.", output: "Laporan pelaksanaan untuk diverifikasi HSE." },
]

const questions = [
  { question: "Apakah TERMA sudah bisa dipakai untuk operasi nyata?", answer: "Belum. Versi ini adalah prototipe interaktif dengan data mock dan aturan NAB fixture yang belum disahkan HSE. Backend, autentikasi, integrasi pesan, serta validasi aturan operasional belum tersedia. Jangan gunakan hasil simulasi sebagai keputusan di lapangan." },
  { question: "Apa yang dimaksud WBGT / ISBB di aplikasi?", answer: "WBGT / ISBB adalah indeks panas yang digunakan sebagai masukan rencana. Aplikasi menunjukkan kualitas sumber setiap bacaan. Data REPLAY adalah data contoh; prakiraan cuaca tidak diperlakukan sebagai pengukuran langsung di lokasi." },
  { question: "Apakah data tersimpan dan tersinkron ke pengguna lain?", answer: "Perubahan demo disimpan di browser dan perangkat yang digunakan melalui localStorage. Data dapat tetap ada setelah halaman dimuat ulang, tetapi tidak tersinkron ke pengguna atau perangkat lain. Jangan memasukkan identitas maupun catatan operasional nyata." },
  { question: "Apakah tombol WhatsApp benar-benar mengirim pesan?", answer: "Tidak. Tombol tersebut membuka pratinjau lokal. Pesan bisa disalin, tetapi aplikasi tidak mengirim pesan. Pencatatan pembagian dan pengakuan penerimaan juga bagian dari simulasi." },
  { question: "Bagaimana cara mencoba peran HSE dan mandor?", answer: "Masuk ke ruang kerja, lalu gunakan pemilih pengguna di header. Ratna mewakili HSE, Budi dan Sari mewakili mandor dua regu, dan Tono mewakili petugas data. Pemilih ini adalah simulasi peran, bukan sistem login." },
]

export default function Home() {
  return <div className="intro-shell">
    <a href="#main-content" className="skip-link">Lewati navigasi ke konten utama</a>
    <header className="intro-header">
      <Wordmark href="/" />
      <nav aria-label="Pengantar" className="landing-nav">
        <a href="#peran">Untuk siapa</a>
        <a href="#cara-kerja">Cara kerja</a>
        <a href="#pertanyaan">FAQ</a>
      </nav>
      <Button asChild variant="outline"><Link href="/ringkasan">Buka ruang kerja<ArrowRight aria-hidden /></Link></Button>
    </header>
    <main id="main-content" tabIndex={-1} className="outline-none">
      <section className="intro-hero" aria-labelledby="intro-title">
        <div className="intro-copy">
          <h1 id="intro-title">Panas di lapangan.<br /><span className="text-primary">Rencana yang jelas.</span></h1>
          <p className="intro-description">TERMA membantu petugas HSE dan mandor mengatur paparan panas pekerja—dari meninjau kondisi lapangan, menyusun rencana kerja-istirahat, hingga memeriksa pelaksanaannya.</p>
          <Button asChild size="lg" className="mt-8 h-auto min-h-12 whitespace-normal py-3"><Link href="/ringkasan">Masuk ke pekerjaan hari ini<ArrowRight className="shrink-0" aria-hidden /></Link></Button>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">Demo interaktif dengan data contoh. Coba sebagai HSE, lalu ganti peran menjadi mandor. Bukan untuk keputusan operasional.</p>
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
      <section id="peran" className="landing-section" aria-labelledby="roles-title">
        <div className="landing-section-heading">
          <h2 id="roles-title">Tiga peran.<br />Tanggung jawab yang jelas.</h2>
          <p>Untuk tim di satu lokasi proyek konstruksi. HSE dan petugas data melihat lingkup lokasi; mandor berfokus pada regunya sendiri.</p>
        </div>
        <div className="landing-roles">{roles.map(role => <article key={role.name}><h3>{role.name}</h3><p className="mt-2 font-medium">{role.purpose}</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{role.tasks}</p><p className="mt-5 border-t pt-4 text-sm leading-relaxed"><span className="text-muted-foreground">Hasil kerja: </span>{role.output}</p></article>)}</div>
      </section>
      <section id="cara-kerja" className="landing-section" aria-labelledby="how-title">
        <div className="landing-section-heading">
          <h2 id="how-title">Dari data lapangan<br />sampai laporan shift.</h2>
          <p>Tujuh tahap yang saling terhubung. Halaman “Hari ini” menunjukkan pekerjaan berikutnya; setiap fitur juga bisa dibuka langsung di bawah ini.</p>
        </div>
        <div className="landing-stages">{stages.map(stage => <div key={stage.title} className="landing-stage">
          <div><h3>{stage.title}</h3><p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{stage.description}</p></div>
          <ol start={stage.steps[0].no}>{stage.steps.map(step => <li key={step.href}><Link href={step.href} className="landing-step"><span className="landing-step-number" aria-hidden>{step.no}</span><span><span className="block font-medium">{step.title}</span><span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{step.description}</span><span className="mt-3 inline-flex items-center gap-2 text-sm text-primary">Buka fitur<ArrowRight className="size-4" aria-hidden /></span></span></Link></li>)}</ol>
        </div>)}</div>
      </section>
      <section className="landing-example" aria-labelledby="example-title">
        <div><h2 id="example-title">Bukan sekadar status.<br />Ada alasan di balik rencana.</h2><p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground">Rencana pekerja menampilkan batas harian, batas per jam, jadwal kerja-istirahat, serta alasan dan usulan perubahan. HSE tetap meninjau sebelum menyetujui.</p><dl className="landing-explanations"><div><dt>Status tindakan</dt><dd>Menjelaskan tindak lanjut yang diperlukan, bukan kondisi kesehatan pekerja.</dd></div><div><dt>Kualitas sumber</dt><dd>Menunjukkan dasar data. Bacaan yang hilang atau kedaluwarsa tidak dianggap sebagai kondisi aman.</dd></div><div><dt>Persetujuan HSE</dt><dd>Dicatat untuk versi rencana tertentu, terpisah dari status tindakan dan kualitas sumber.</dd></div></dl></div>
        <figure className="landing-plan-example"><figcaption className="text-sm text-muted-foreground">Contoh informasi rencana · data ilustratif</figcaption><h3 className="mt-6 font-heading text-2xl font-medium">Andi (demo)</h3><p className="mt-1 text-sm text-muted-foreground">Regu Cor · profil pekerja</p><dl className="mt-6 divide-y"><div><dt>Status tindakan</dt><dd><StatusChip status="ADAPTASI_DIPERLUKAN" /></dd></div><div><dt>Kualitas bacaan</dt><dd><QualityBadge kualitas="REPLAY" /></dd></div><div><dt>Persetujuan</dt><dd className="text-sm font-medium">Disetujui HSE</dd></div></dl><p className="mt-5 text-xs leading-relaxed text-muted-foreground">Contoh format informasi, bukan status terbaru ruang kerja. Nilai dan persetujuan di dalam demo mengikuti perubahan yang Anda buat.</p><Link href="/pekerja/DEMO001#rencana" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium underline underline-offset-4">Lihat contoh profil pekerja<ArrowRight className="size-4" aria-hidden /></Link></figure>
      </section>
      <section className="landing-section" aria-labelledby="demo-title">
        <div className="landing-section-heading"><h2 id="demo-title">Coba alurnya.<br />Kenali batas demonya.</h2><p>Ruang kerja awal sudah berisi 8 pekerja fiktif, 2 regu, 3 zona, dan bacaan replay. Anda dapat mencoba alur tanpa menyiapkan data sendiri.</p></div>
        <div className="landing-demo-columns">
          <div><h3>Yang bisa Anda coba</h3><ul><li>Mengubah data dan penugasan, lalu melihat pembaruan rencana.</li><li>Menyetujui rencana dan mencoba penerimaan instruksi sebagai mandor.</li><li>Mencatat pelaksanaan, memverifikasi, dan mencetak laporan.</li><li>Mencari pekerja serta menelusuri riwayat aktivitas pada browser ini.</li></ul></div>
          <div><h3>Yang belum tersedia</h3><ul><li>Data sensor langsung atau integrasi pemantauan lapangan.</li><li>Login sungguhan, backend, dan sinkronisasi antarpengguna.</li><li>Pengiriman WhatsApp atau pesan otomatis.</li><li>Aturan operasional yang sudah disahkan HSE.</li></ul></div>
        </div>
        <p className="landing-demo-note">Gunakan data fiktif saja. Demo ini bukan alat diagnosis, izin medis, atau dasar keputusan operasional.</p>
      </section>
      <section id="pertanyaan" className="landing-section landing-faq" aria-labelledby="faq-title">
        <div><h2 id="faq-title">Sebelum Anda mulai.</h2><p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">Jawaban singkat tentang data, peran, dan cara menggunakan simulasi TERMA.</p><Link href="/panduan" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4">Baca panduan aplikasi<ArrowRight className="size-4" aria-hidden /></Link></div>
        <Accordion type="single" collapsible>{questions.map((item, index) => <AccordionItem key={item.question} value={String(index)}><AccordionTrigger className="py-5 text-base">{item.question}</AccordionTrigger><AccordionContent className="max-w-prose text-sm leading-relaxed text-muted-foreground">{item.answer}</AccordionContent></AccordionItem>)}</Accordion>
      </section>
      <section className="landing-start" aria-labelledby="start-title">
        <div><h2 id="start-title">Lihat cara kerja TERMA<br />dalam satu shift simulasi.</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">Mulai dari pekerjaan yang perlu perhatian, lalu ikuti rencana hingga laporan. Anda bisa kembali ke halaman ini kapan saja.</p></div>
        <Button asChild size="lg"><Link href="/ringkasan">Coba ruang kerja demo<ArrowRight aria-hidden /></Link></Button>
      </section>
    </main>
    <footer className="intro-footer"><p>Demo dengan data simulasi. Bukan untuk keputusan operasional atau diagnosis medis; aturan perhitungan belum disahkan HSE.</p><Link href="/panduan" className="shrink-0 underline underline-offset-4">Panduan & batas demo</Link></footer>
  </div>
}
