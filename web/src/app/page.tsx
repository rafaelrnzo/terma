import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/ssr"
import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/wordmark"
import { LandingHandoff } from "@/components/landing-handoff"
import { LandingMotion } from "@/components/landing-motion"
import { LandingHeroFlow } from "@/components/landing-hero-flow"
import { DeviceEcosystem } from "@/components/device-ecosystem"
import { LandingSite } from "@/components/landing-site"
import { QualityBadge, StatusChip } from "@/components/status"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "TERMA · Kenali alur pengelolaan paparan panas kerja",
  description: "Kenali fitur dan alur TERMA: data pekerja, adaptasi, pengukuran panas, rencana kerja-istirahat, instruksi mandor, verifikasi, dan laporan.",
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
      { no: 5, title: "Instruksi untuk mandor", description: "Siapkan pesan per regu, catat pembagian manual, lalu minta mandor mengakui penerimaannya. Pesan tersedia sebagai pratinjau untuk dibagikan manual.", href: "/instruksi" },
    ],
  },
  {
    title: "Catat hingga terverifikasi",
    description: "Pisahkan yang direncanakan, yang dilaporkan, dan yang sudah diperiksa HSE.",
    steps: [
      { no: 6, title: "Pelaksanaan & verifikasi", description: "Mandor mencatat durasi aktual dan tindakan regunya. HSE memeriksa laporan dan mencatat hasil verifikasi.", href: "/tindakan" },
      { no: 7, title: "Laporan & jejak aktivitas", description: "Baca rekap tanggal terpilih, tindak lanjut, dan riwayat aktivitas. Cetak laporan untuk meninjau hasil pelaksanaan.", href: "/laporan" },
    ],
  },
]

const roles = [
  { name: "Petugas data", purpose: "Menyiapkan dasar rencana.", tasks: "Memasukkan pekerja, penugasan, kehadiran, serta bacaan panas. Memeriksa data yang belum lengkap.", output: "Data awal untuk ditinjau HSE." },
  { name: "Petugas HSE", purpose: "Meninjau dan mengambil keputusan.", tasks: "Mengonfirmasi adaptasi, meninjau rencana, memberi persetujuan, dan memverifikasi laporan mandor.", output: "Rencana yang ditinjau dan tindak lanjut yang diperiksa." },
  { name: "Mandor", purpose: "Menghubungkan rencana dengan pelaksanaan.", tasks: "Menerima instruksi untuk regunya, mengakui penerimaan, lalu mencatat durasi dan tindakan aktual.", output: "Laporan pelaksanaan untuk diverifikasi HSE." },
]

const questions = [
  { question: "Dari mana pekerjaan dimulai?", answer: "Buka Data pekerja dan tambahkan identitas beserta penugasan awal. Kemudian buat draft shift, pilih tanggal dan peserta, lalu lanjutkan persiapan dari halaman shift." },
  { question: "Kapan shift dinyatakan selesai?", answer: "HSE menyetujui seluruh rencana dan menerbitkan shift. Mandor menerima instruksi dan melaporkan pelaksanaan. Setelah semua tindakan diverifikasi, HSE menutup shift dan laporan akhir dikunci." },
  { question: "Bagaimana perubahan data pekerja memengaruhi shift?", answer: "Perubahan master berlaku pada shift berikutnya. Setiap shift menyimpan peserta dan penugasannya sendiri. Pekerja dengan riwayat dapat diarsipkan; catatan shift tetap tersedia." },
  { question: "Bagaimana status koneksi dan penyimpanan?", answer: "Data disimpan di browser ini dan belum tersinkron antarperangkat. Koneksi sensor, RFID, BLE, autentikasi server, serta validasi aturan lapangan merupakan tahapan integrasi berikutnya. Status perangkat dapat dilihat pada menu Perangkat IoT." },
  { question: "Bagaimana instruksi dibagikan?", answer: "HSE menyalin atau menyiapkan pesan per regu dan mencatat pembagian secara manual. Mandor mengakui penerimaan secara terpisah sebelum mencatat pelaksanaan." },
]

export default function Home() {
  return <div className="intro-shell">
    <LandingMotion />
    <a href="#main-content" className="skip-link">Lewati navigasi ke konten utama</a>
    <header className="intro-header">
      <Wordmark href="/" />
      <nav aria-label="Pengantar" className="landing-nav">
        <a href="#peran">Untuk siapa</a>
        <a href="#cara-kerja">Cara kerja</a>
        <a href="#pertanyaan">FAQ</a>
      </nav>
      <Button asChild variant="outline" className="intro-header-action"><Link href="/ringkasan">Buka ruang kerja<ArrowRight aria-hidden /></Link></Button>
    </header>
    <main id="main-content" tabIndex={-1} className="outline-none">
      <section className="intro-hero" aria-labelledby="intro-title">
        <div className="intro-copy">
          <h1 id="intro-title">Kerja di tengah panas.<br /><span>Rencana tetap jelas.</span></h1>
          <p className="intro-description">TERMA menyatukan data pekerja, bacaan panas, dan tindak lanjut menjadi rencana kerja-istirahat yang dapat ditinjau HSE dan dijalankan mandor.</p>
          <Button asChild size="lg" className="intro-hero-action"><Link href="/ringkasan">Masuk ke ruang kerja<ArrowRight className="shrink-0" aria-hidden /></Link></Button>
          <p className="intro-hero-note">Data pekerja → draft shift → pelaksanaan → laporan akhir.</p>
        </div>
        <LandingHeroFlow />
        <div className="intro-hero-track" aria-hidden="true"><span>Data lapangan</span><i /><span>Rencana HSE</span><i /><span>Pelaksanaan regu</span></div>
      </section>
      <section className="landing-product" aria-labelledby="product-title">
        <div className="landing-product-heading"><h2 id="product-title">Satu lokasi, tiga hal yang saling terhubung.</h2><p>Kenali area kerja, alur regu, dan ruang istirahat sebelum membuka rencana. Ilustrasi ini memakai lokasi contoh, tanpa pelacakan pekerja.</p></div>
        <LandingSite />
      </section>
      <section className="landing-section" aria-labelledby="iot-title"><div className="landing-device-intro"><p className="eyebrow">THERMAL EXPOSURE & RENAL MONITORING ASSISTANT</p><h2 id="iot-title">Tiga perangkat. Satu rencana personal.</h2><p>Data panas per zona, kunjungan ke tempat minum, dan band bergilir untuk pekerja paling berisiko. TERMA menghubungkannya dengan persetujuan HSE dan tindak lanjut klinik. Spesifikasi berikut adalah rancangan proposal; integrasi langsung masih dikembangkan.</p></div><DeviceEcosystem /><Link href="/perangkat" className="panel-link mt-5">Jelajahi ekosistem IoT<ArrowRight size={16} /></Link></section>
      <section id="peran" className="landing-section" aria-labelledby="roles-title">
        <div className="landing-section-heading">
          <h2 id="roles-title">Setiap peran tahu langkah berikutnya.</h2>
          <p>Untuk tim di satu lokasi proyek konstruksi. Petugas data menyiapkan dasar, HSE meninjau rencana, dan mandor mencatat pelaksanaan regunya.</p>
        </div>
        <div className="landing-team">
          <div className="landing-roles">{roles.map(role => <article key={role.name}><h3>{role.name}</h3><p className="mt-2 font-medium">{role.purpose}</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{role.tasks}</p><p className="mt-3 text-sm leading-relaxed"><span className="text-muted-foreground">Hasil kerja: </span>{role.output}</p></article>)}</div>
          <LandingHandoff />
        </div>
      </section>
      <section id="cara-kerja" className="landing-section" aria-labelledby="how-title">
        <div className="landing-section-heading">
          <h2 id="how-title">Dari data lapangan<br />sampai laporan shift.</h2>
          <p>Mulai dari daftar shift. Siapkan peserta dan data lapangan, terbitkan rencana, lalu tutup setelah pelaksanaan diverifikasi.</p>
        </div>
        <div className="landing-stages">{stages.map(stage => <div key={stage.title} className="landing-stage">
          <div><h3>{stage.title}</h3><p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{stage.description}</p></div>
          <ol start={stage.steps[0].no}>{stage.steps.map(step => <li key={step.href}><Link href={step.href} className="landing-step" aria-label={`Buka ${step.title}`}><span className="landing-step-number" aria-hidden>{step.no}</span><span className="font-medium">{step.title}</span><ArrowRight className="ml-auto size-4 shrink-0 text-primary" aria-hidden /></Link></li>)}</ol>
        </div>)}</div>
      </section>
      <section className="landing-example" aria-labelledby="example-title">
        <div><h2 id="example-title">Bukan sekadar status.<br />Ada alasan di balik rencana.</h2><p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground">Rencana pekerja menampilkan batas harian, batas per jam, jadwal kerja-istirahat, serta alasan dan usulan perubahan. HSE tetap meninjau sebelum menyetujui.</p><dl className="landing-explanations"><div><dt>Status tindakan</dt><dd>Menjelaskan tindak lanjut yang diperlukan, bukan kondisi kesehatan pekerja.</dd></div><div><dt>Kualitas sumber</dt><dd>Menunjukkan dasar data. Bacaan yang hilang atau kedaluwarsa tidak dianggap sebagai kondisi aman.</dd></div><div><dt>Persetujuan HSE</dt><dd>Dicatat untuk versi rencana tertentu, terpisah dari status tindakan dan kualitas sumber.</dd></div></dl></div>
        <figure className="landing-plan-example"><figcaption className="text-sm text-muted-foreground">Contoh informasi rencana · data ilustratif</figcaption><h3 className="mt-6 font-heading text-2xl font-medium">Profil pekerja</h3><p className="mt-1 text-sm text-muted-foreground">Regu Cor · profil pekerja</p><dl className="mt-6 divide-y"><div><dt>Status tindakan</dt><dd><StatusChip status="ADAPTASI_DIPERLUKAN" /></dd></div><div><dt>Kualitas bacaan</dt><dd><QualityBadge kualitas="REPLAY" /></dd></div><div><dt>Persetujuan</dt><dd className="text-sm font-medium">Disetujui HSE</dd></div></dl><p className="mt-5 text-xs leading-relaxed text-muted-foreground">Contoh format informasi, bukan status terbaru ruang kerja. Nilai dan persetujuan mengikuti versi rencana pada shift yang dibuka.</p><Link href="/ringkasan" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium underline underline-offset-4">Buka shift kerja<ArrowRight className="size-4" aria-hidden /></Link></figure>
      </section>
      <section className="landing-section" aria-labelledby="lifecycle-title"><div className="landing-section-heading"><h2 id="lifecycle-title">Awal yang jelas.<br />Akhir yang tercatat.</h2><p>Kelola pekerja satu kali, gunakan kembali untuk setiap shift. Semua keputusan dan laporan mengikuti status pekerjaan yang sedang berlangsung.</p></div><ol className="workflow-map"><li><span>01</span><strong>Data pekerja</strong><p>Tambah, edit, atau arsipkan identitas.</p></li><li><span>02</span><strong>Draft shift</strong><p>Pilih peserta dan siapkan rencana.</p></li><li><span>03</span><strong>Shift berjalan</strong><p>Bagikan instruksi dan catat pelaksanaan.</p></li><li><span>04</span><strong>Shift selesai</strong><p>Verifikasi, tutup, dan cetak laporan.</p></li></ol></section>
      <section id="pertanyaan" className="landing-section landing-faq" aria-labelledby="faq-title">
        <div><h2 id="faq-title">Sebelum Anda mulai.</h2><p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">Jawaban singkat tentang data, peran, dan cara menggunakan TERMA.</p><Link href="/panduan" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4">Baca panduan aplikasi<ArrowRight className="size-4" aria-hidden /></Link></div>
        <Accordion type="single" collapsible>{questions.map((item, index) => <AccordionItem key={item.question} value={String(index)}><AccordionTrigger className="py-5 text-base">{item.question}</AccordionTrigger><AccordionContent className="max-w-prose text-sm leading-relaxed text-muted-foreground">{item.answer}</AccordionContent></AccordionItem>)}</Accordion>
      </section>
      <section className="landing-start" aria-labelledby="start-title">
        <div><h2 id="start-title">Kelola satu shift.<br />Dari awal hingga selesai.</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">Mulai dari pekerjaan yang perlu perhatian, lalu ikuti rencana hingga laporan. Anda bisa kembali ke halaman ini kapan saja.</p></div>
        <Button asChild size="lg"><Link href="/ringkasan">Buka ruang kerja<ArrowRight aria-hidden /></Link></Button>
      </section>
    </main>
    <footer className="intro-footer"><p>TERMA · Thermal Exposure & Renal Monitoring Assistant</p><Link href="/panduan" className="shrink-0 underline underline-offset-4">Panduan penggunaan</Link></footer>
  </div>
}
